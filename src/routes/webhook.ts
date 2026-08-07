import type { FastifyInstance } from 'fastify';
import { logger } from '../logger.js';
import {
  getTenantByInstance,
  pauseConversationByContact,
  resumeConversationByContact,
  getConversation,
  getOrCreateConversation,
} from '../db/repositories.js';
import { parseIncoming } from '../evolution/webhook.js';
import { getBase64FromMediaMessage, sendText, foiEnviadoPeloBot } from '../evolution/client.js';
import { transcricaoAtiva, transcreverAudio } from '../agent/transcribe.js';
import { handleLeadMessage } from '../core/conversation.js';

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // A Evolution API chama esta rota a cada mensagem recebida.
  app.post('/webhook/:instance', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const payload = req.body as any;

    // Responde 200 imediatamente para não estourar timeout do webhook;
    // o processamento acontece em background.
    reply.code(200).send({ ok: true });

    try {
      const msg = parseIncoming(payload);
      if (!msg || msg.isGroup) return;

      // Mensagem enviada PELO número do escritório (fromMe):
      // se não foi a Júria que enviou, foi o ADVOGADO manualmente (texto ou
      // áudio) — a Júria pausa e deixa o humano assumir.
      // A pausa vale por TAKEOVER_HORAS e renova a cada mensagem manual; se a
      // janela expirar e o lead voltar a escrever, a Júria reassume sozinha.
      // Comandos do advogado no chat: "#pausar" (pausa sem prazo) e
      // "#voltar" (devolve a conversa para a Júria imediatamente).
      if (msg.fromMe) {
        const TAKEOVER_HORAS = 24;
        const ehManual =
          (msg.texto && !foiEnviadoPeloBot(instance, msg.contato, msg.texto)) || msg.isAudio;
        if (!ehManual) return;

        const tenant = await getTenantByInstance(instance);
        if (!tenant) return;

        const comando = (msg.texto ?? '').trim().toLowerCase();
        if (comando === '#voltar' || comando === '#retomar') {
          const id = await resumeConversationByContact(tenant.id, msg.contato);
          if (id) logger.info({ instance, contato: msg.contato }, 'Comando #voltar — Júria reassumiu');
          return;
        }
        if (comando === '#pausar') {
          await pauseConversationByContact(tenant.id, msg.contato, null); // sem prazo
          logger.info({ instance, contato: msg.contato }, 'Comando #pausar — Júria pausada sem prazo');
          return;
        }
        if (comando === '#atender') {
          // Ativa a Júria para este contato (útil no modo "só anúncios":
          // libera um contato que não veio de anúncio para ser atendido).
          await getOrCreateConversation(tenant.id, msg.contato, null);
          await resumeConversationByContact(tenant.id, msg.contato);
          logger.info({ instance, contato: msg.contato }, 'Comando #atender — Júria ativada para este contato');
          return;
        }

        const ate = new Date(Date.now() + TAKEOVER_HORAS * 3600_000).toISOString();
        const pausada = await pauseConversationByContact(tenant.id, msg.contato, ate);
        if (pausada) {
          logger.info(
            { instance, contato: msg.contato, ate },
            'Advogado assumiu a conversa — Júria pausada (janela renovável)',
          );
        }
        return;
      }

      if (!msg.texto && !msg.isAudio && !msg.anexo) return; // ignora outros tipos de mídia

      const tenant = await getTenantByInstance(instance);
      if (!tenant) {
        logger.warn({ instance }, 'Webhook recebido para instância sem tenant ativo');
        return;
      }

      // Modo "só anúncios": em WhatsApp misto (clientes do dia a dia + leads),
      // a Júria só inicia atendimento de contato NOVO que venha de anúncio
      // (metadados do Meta) ou cuja 1ª mensagem contenha frase do anúncio.
      // Conversas já iniciadas seguem normalmente; #atender libera exceções.
      if ((tenant.modo_atendimento ?? 'todos') === 'so_anuncio') {
        const conversaExistente = await getConversation(tenant.id, msg.contato);
        if (!conversaExistente) {
          const frases = (tenant.frases_anuncio ?? '')
            .split(',')
            .map((f) => f.trim().toLowerCase())
            .filter(Boolean);
          const bateFrase =
            !!msg.texto && frases.some((f) => (msg.texto as string).toLowerCase().includes(f));
          if (!msg.veioDeAnuncio && !bateFrase) {
            logger.info(
              { instance, contato: msg.contato },
              'Modo só-anúncios: contato sem origem de anúncio — Júria não responde',
            );
            return;
          }
        }
      }

      let texto = msg.texto;

      // Mensagem de áudio: baixa da Evolution e transcreve
      if (!texto && msg.isAudio && msg.messageId) {
        if (!transcricaoAtiva()) {
          await sendText(
            instance,
            msg.contato,
            'Recebi seu áudio! 🎙️ No momento consigo te atender melhor por *texto* — pode me escrever a sua dúvida?',
          );
          return;
        }
        const media = await getBase64FromMediaMessage(instance, msg.messageId);
        if (media) {
          texto = await transcreverAudio(media.base64, media.mimetype);
          if (texto) logger.info({ instance }, 'Áudio transcrito com sucesso');
        }
        if (!texto) {
          await sendText(
            instance,
            msg.contato,
            'Desculpe, não consegui entender o áudio. 😔 Pode tentar de novo ou me escrever por texto?',
          );
          return;
        }
      }

      // Anexo (documento/foto): entra como marcador para a IA saber que chegou,
      // junto com a legenda, se houver.
      if (msg.anexo) texto = texto ? `${msg.anexo} ${texto}` : msg.anexo;

      if (!texto) return;
      await handleLeadMessage(tenant, msg.contato, msg.nomeContato, texto);
    } catch (err) {
      logger.error({ err, instance }, 'Erro ao processar webhook');
    }
  });
}
