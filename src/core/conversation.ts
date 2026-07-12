import { logger } from '../logger.js';
import type { Tenant } from '../db/types.js';
import {
  getOrCreateConversation,
  addMessage,
  getRecentMessages,
  upsertLead,
  markLeadEncaminhado,
  setConversationStatus,
} from '../db/repositories.js';
import { pensar } from '../agent/brain.js';
import { sendText } from '../evolution/client.js';
import { notificarAdvogado } from '../notify/handoff.js';

/**
 * Fluxo principal de uma mensagem recebida de um lead:
 * salva -> pensa (IA) -> responde -> registra ficha -> notifica advogado se qualificado.
 */
export async function handleLeadMessage(
  tenant: Tenant,
  contato: string,
  nomeContato: string | null,
  texto: string,
): Promise<void> {
  const conversa = await getOrCreateConversation(tenant.id, contato, nomeContato);

  // Se um humano pausou a conversa, a IA não responde.
  if (conversa.status === 'pausado') {
    logger.info({ conversa: conversa.id }, 'Conversa pausada — IA não responde');
    await addMessage(conversa.id, 'user', texto);
    return;
  }

  await addMessage(conversa.id, 'user', texto);

  const history = await getRecentMessages(conversa.id, 30);
  const { reply, lead, prontoParaEncaminhar } = await pensar(tenant, history);

  // Responde ao lead pelo WhatsApp
  await sendText(tenant.evolution_instance, contato, reply);
  await addMessage(conversa.id, 'assistant', reply);

  // Atualiza a ficha estruturada, se houver algo novo
  if (Object.keys(lead).length > 0) {
    await upsertLead(conversa.id, tenant.id, {
      nome: lead.nome,
      area_juridica: lead.area_juridica,
      resumo_caso: lead.resumo_caso,
      urgencia: lead.urgencia,
      qualificado: lead.qualificado ?? undefined,
      dados: lead.observacoes ? { observacoes: lead.observacoes } : undefined,
    });
  }

  // Encaminhamento: notifica o advogado uma única vez
  if (prontoParaEncaminhar && conversa.status !== 'encaminhado') {
    await notificarAdvogado(tenant, contato, lead);
    await markLeadEncaminhado(conversa.id);
    await setConversationStatus(conversa.id, 'encaminhado');
  }
}
