import Fastify from 'fastify';
import { config } from './config.js';
import { logger } from './logger.js';
import { webhookRoutes } from './routes/webhook.js';
import { adminRoutes } from './routes/admin.js';
import { painelRoutes } from './routes/painel.js';
import { maqueteRoutes } from './routes/maquete.js';
import { crmApiRoutes } from './routes/crmApi.js';
import { crmAppRoutes } from './routes/crmApp.js';
import { iniciarFollowups } from './core/followups.js';

async function main(): Promise<void> {
  const app = Fastify({ loggerInstance: logger as any });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(webhookRoutes);
  await app.register(adminRoutes);
  await app.register(painelRoutes);
  await app.register(maqueteRoutes);
  await app.register(crmApiRoutes);
  await app.register(crmAppRoutes);

  await app.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(`Agente de pré-atendimento no ar na porta ${config.port}`);

  iniciarFollowups();
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao iniciar o servidor');
  process.exit(1);
});
