import { logger } from '../logger.js';
import type { Tenant } from '../db/types.js';
import {
  getOrCreateConversation,
  addMessage,
  getRecentMessages,
  upsertLead,
  markLeadEncaminhado,
  setConversationStatus,
  touchLeadActivity,
  ensureLead,
  marcarEtapaQualificado,
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

  // Se um humano (advogado) assumiu, a IA não responde — só registra.
  // Exceção: se a janela de takeover expirou, a Júria reassume sozinha
  // (para o lead não ficar sem resposta caso o advogado tenha esquecido).
  if (conversa.status === 'pausado') {
    const janelaExpirou =
      conversa.pausado_ate != null && new Date(conversa.pausado_ate).getTime() < Date.now();
    if (!janelaExpirou) {
      logger.info({ conversa: conversa.id }, 'Conversa pausada (advogado assumiu) — IA não responde');
      await addMessage(conversa.id, 'user', texto);
      await touchLeadActivity(conversa.id);
      return;
    }
    await setConversationStatus(conversa.id, 'ativo');
    conversa.status = 'ativo';
    logger.info({ conversa: conversa.id }, 'Janela de takeover expirou — Júria reassumiu');
  }

  // Lead voltou depois do encerramento por inatividade: reabre a conversa.
  if (conversa.status === 'encerrado') {
    await setConversationStatus(conversa.id, 'ativo');
    conversa.status = 'ativo';
  }

  await addMessage(conversa.id, 'user', texto);
  await touchLeadActivity(conversa.id); // zera o ciclo de follow-ups
  await ensureLead(conversa.id, tenant.id, nomeContato); // entra no funil do CRM ("novo")

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

  // Encaminhamento: notifica o advogado uma única vez.
  // Dispara tanto pela flag explícita quanto por qualificado=true — a IA às
  // vezes marca só um dos dois, e um lead qualificado nunca pode se perder.
  const deveEncaminhar = prontoParaEncaminhar || lead.qualificado === true;
  if (deveEncaminhar && conversa.status !== 'encaminhado') {
    await notificarAdvogado(tenant, contato, lead);
    await markLeadEncaminhado(conversa.id);
    await setConversationStatus(conversa.id, 'encaminhado');
    await marcarEtapaQualificado(conversa.id); // avança no funil do CRM
  }
}
