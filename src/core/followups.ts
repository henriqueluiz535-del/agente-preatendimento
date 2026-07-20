// ============================================================
// Follow-up automático: reengaja leads que pararam de responder.
//
// Cadência (contada a partir da ÚLTIMA mensagem do lead):
//   1º follow-up:  1h depois   ┐
//   2º follow-up:  4h depois   ├─ mesmo dia (3 tentativas)
//   3º follow-up:  8h depois   ┘
//   4º follow-up: 24h depois   (dia seguinte)
//   5º follow-up: 30h depois   (última tentativa — encerra a conversa)
//
// Regras:
// - Só envia se a última mensagem da conversa for da Júria (lead calado).
// - Só envia dentro do horário comercial (08h–20h, horário de Brasília).
// - Se o lead responder, o ciclo zera (touchLeadActivity no webhook).
// - Se o advogado assumir (conversa pausada), follow-ups param.
// - Após o último follow-up a conversa vira "encerrado"; se o lead voltar
//   a escrever, ela reabre automaticamente.
//
// ⚠️ Cuidado com exagero: mensagens proativas em excesso aumentam o risco
// de bloqueio do número pelo WhatsApp. Ajuste OFFSETS_MIN se necessário.
// ============================================================
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logger } from '../logger.js';
import {
  listFollowupCandidates,
  getLastMessage,
  getRecentMessages,
  getTenantById,
  addMessage,
  registerFollowupSent,
  setConversationStatus,
} from '../db/repositories.js';
import { sendText } from '../evolution/client.js';
import { buildSystemPrompt } from '../agent/systemPrompt.js';
import { registrarLeadTool } from '../agent/tools.js';
import type { Tenant } from '../db/types.js';

// Minutos após o último contato do lead para cada tentativa.
const OFFSETS_MIN = [60, 240, 480, 1440, 1800];
// Janela permitida para envio (horário local de Brasília).
const HORA_INICIO = 8;
const HORA_FIM = 20;
const FUSO_BRASILIA = -3; // UTC-3
// Espaçamento mínimo entre dois follow-ups na mesma conversa.
const ESPACO_MINIMO_MIN = 45;
// Intervalo do verificador.
const TICK_MS = 5 * 60 * 1000;

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

export function iniciarFollowups(): void {
  setInterval(() => {
    tick().catch((err) => logger.error({ err }, 'Erro no ciclo de follow-ups'));
  }, TICK_MS);
  logger.info('Follow-ups automáticos ativados (verificação a cada 5 min)');
}

function dentroDoHorario(): boolean {
  const horaLocal = (new Date().getUTCHours() + 24 + FUSO_BRASILIA) % 24;
  return horaLocal >= HORA_INICIO && horaLocal < HORA_FIM;
}

async function tick(): Promise<void> {
  if (!dentroDoHorario()) return;

  const candidatas = await listFollowupCandidates(OFFSETS_MIN.length);
  for (const conversa of candidatas) {
    try {
      await processar(conversa);
    } catch (err) {
      logger.error({ err, conversa: conversa.id }, 'Falha ao processar follow-up');
    }
  }
}

async function processar(conversa: any): Promise<void> {
  const n = conversa.followups_enviados as number; // próximos = n+1
  const base = new Date(conversa.ultimo_contato_lead ?? conversa.created_at).getTime();
  const devidoEm = base + OFFSETS_MIN[n] * 60_000;
  if (Date.now() < devidoEm) return;

  // Espaçamento mínimo entre follow-ups
  if (conversa.ultimo_followup) {
    const ultimo = new Date(conversa.ultimo_followup).getTime();
    if (Date.now() - ultimo < ESPACO_MINIMO_MIN * 60_000) return;
  }

  // Só reengaja se o lead está de fato calado (última msg é da Júria)
  const ultima = await getLastMessage(conversa.id);
  if (!ultima || ultima.role !== 'assistant') return;

  const tenant = await getTenantById(conversa.tenant_id);
  if (!tenant) return;

  const ehUltimo = n + 1 >= OFFSETS_MIN.length;
  const texto = await gerarMensagem(tenant, conversa.id, n + 1, OFFSETS_MIN.length, ehUltimo);

  await sendText(tenant.evolution_instance, conversa.contato, texto);
  await addMessage(conversa.id, 'assistant', texto);
  await registerFollowupSent(conversa.id, n + 1);
  if (ehUltimo) await setConversationStatus(conversa.id, 'encerrado');

  logger.info(
    { conversa: conversa.id, tentativa: n + 1, encerrou: ehUltimo },
    'Follow-up enviado',
  );
}

async function gerarMensagem(
  tenant: Tenant,
  conversationId: string,
  tentativa: number,
  total: number,
  ehUltimo: boolean,
): Promise<string> {
  const historico = await getRecentMessages(conversationId, 20);
  const instrucao = ehUltimo
    ? 'O cliente está sem responder há bastante tempo. Escreva UMA mensagem curta (máx. 2 frases) e cordial de DESPEDIDA: diga que vai encerrar o atendimento por enquanto para não incomodar, e que ele pode chamar a qualquer momento para retomar. Não use ferramentas. Responda apenas com a mensagem.'
    : `O cliente está sem responder há algum tempo (tentativa ${tentativa} de ${total} de reengajamento). Escreva UMA mensagem curta (máx. 2 frases), cordial e leve, retomando o assunto da conversa e convidando a pessoa a continuar. Varie a abordagem em relação às mensagens anteriores. Não use ferramentas. Responda apenas com a mensagem.`;

  try {
    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 300,
      // Mesmo prefixo (ferramentas + system) das chamadas de conversa do tenant,
      // para reaproveitar o MESMO cache — a instrução proíbe usar a ferramenta.
      system: [{ type: 'text' as const, text: buildSystemPrompt(tenant), cache_control: { type: 'ephemeral' as const } }],
      tools: [registrarLeadTool],
      messages: [
        ...historico.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: `[instrução interna da plataforma — o cliente NÃO enviou mensagem] ${instrucao}` },
      ],
    });
    const texto = response.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join(' ')
      .trim();
    if (texto) return texto;
  } catch (err) {
    logger.error({ err }, 'Falha ao gerar follow-up com IA — usando fallback');
  }

  // Fallback simples caso a IA falhe
  return ehUltimo
    ? 'Para não te incomodar, vou encerrar nosso atendimento por enquanto. Quando quiser retomar, é só me chamar por aqui! 😊'
    : 'Oi! Passando para saber se você ainda tem interesse em continuar nosso atendimento. Estou por aqui! 😊';
}
