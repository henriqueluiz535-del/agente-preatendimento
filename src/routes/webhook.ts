import type { FastifyInstance } from 'fastify';
import { logger } from '../logger.js';
import { getTenantByInstance } from '../db/repositories.js';
import { parseIncoming } from '../evolution/webhook.js';
import { getBase64FromMediaMessage, sendText } from '../evolution/client.js';
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
      if (!msg || msg.fromMe || msg.isGroup) return;
      if (!msg.texto && !msg.isAudio) return; // ignora outros tipos de mídia

      const tenant = await getTenantByInstance(instance);
      if (!tenant) {
        logger.warn({ instance }, 'Webhook recebido para instância sem tenant ativo');
        return;
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

      if (!texto) return;
      await handleLeadMessage(tenant, msg.contato, msg.nomeContato, texto);
    } catch (err) {
      logger.error({ err, instance }, 'Erro ao processar webhook');
    }
  });
}
