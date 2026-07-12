import type { FastifyInstance } from 'fastify';
import { logger } from '../logger.js';
import { getTenantByInstance } from '../db/repositories.js';
import { parseIncoming } from '../evolution/webhook.js';
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
      if (!msg || msg.fromMe || msg.isGroup || !msg.texto) return;

      const tenant = await getTenantByInstance(instance);
      if (!tenant) {
        logger.warn({ instance }, 'Webhook recebido para instância sem tenant ativo');
        return;
      }

      await handleLeadMessage(tenant, msg.contato, msg.nomeContato, msg.texto);
    } catch (err) {
      logger.error({ err, instance }, 'Erro ao processar webhook');
    }
  });
}
