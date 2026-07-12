import { logger } from '../logger.js';
import type { Tenant } from '../db/types.js';
import type { RegistrarLeadInput } from '../agent/tools.js';
import { sendText } from '../evolution/client.js';

/**
 * Avisa o advogado (no WhatsApp dele) que um novo lead foi qualificado.
 * Envia pela mesma instância do escritório.
 */
export async function notificarAdvogado(
  tenant: Tenant,
  contatoLead: string,
  lead: RegistrarLeadInput,
): Promise<void> {
  if (!tenant.whatsapp_advogado) {
    logger.warn({ tenant: tenant.evolution_instance }, 'Sem whatsapp_advogado configurado — pulando notificação');
    return;
  }

  const linhas = [
    '🟢 *Novo lead qualificado (pré-atendimento)*',
    '',
    `👤 Nome: ${lead.nome ?? 'não informado'}`,
    `📱 Contato: ${contatoLead}`,
    `⚖️ Área: ${lead.area_juridica ?? 'não identificada'}`,
    `🔥 Urgência: ${lead.urgencia ?? 'não avaliada'}`,
    '',
    `📝 Resumo: ${lead.resumo_caso ?? '—'}`,
  ];
  if (lead.observacoes) linhas.push('', `ℹ️ Observações: ${lead.observacoes}`);

  await sendText(tenant.evolution_instance, tenant.whatsapp_advogado, linhas.join('\n'));
  logger.info({ tenant: tenant.evolution_instance, contatoLead }, 'Advogado notificado do lead qualificado');
}
