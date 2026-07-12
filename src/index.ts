import Fastify from 'fastify';
import { config } from './config.js';
import { logger } from './logger.js';
import { webhookRoutes } from './routes/webhook.js';
import { adminRoutes } from './routes/admin.js';

async function main(): Promise<void> {
  const app = Fastify({ loggerInstance: logger as any });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(webhookRoutes);
  await app.register(adminRoutes);

  await app.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(`Agente de pré-atendimento no ar na porta ${config.port}`);
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao iniciar o servidor');
  process.exit(1);
});
