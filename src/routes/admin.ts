import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { createTenant, getTenantByInstance, listTenants, listLeads } from '../db/repositories.js';
import { createInstance, connectInstance, connectionState } from '../evolution/client.js';

interface CriarTenantBody {
  nome_escritorio: string;
  nome_advogado: string;
  nome_assistente?: string;
  areas?: string[];
  tom?: string;
  instrucoes_customizadas?: string;
  criterios_qualificacao?: string;
  horario_atendimento?: string;
  whatsapp_advogado?: string;
  evolution_instance?: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Autenticação simples por API key nas rotas /admin/*
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/admin')) return;
    const key = req.headers['x-admin-key'];
    if (key !== config.adminApiKey) {
      reply.code(401).send({ error: 'não autorizado' });
    }
  });

  /**
   * Onboarding plug-and-play de um novo advogado:
   * 1. cria o tenant no banco
   * 2. cria a instância no Evolution (com webhook apontado para cá)
   * 3. retorna o QR Code para o advogado escanear
   */
  app.post('/admin/tenants', async (req, reply) => {
    const body = req.body as CriarTenantBody;
    if (!body?.nome_escritorio || !body?.nome_advogado) {
      return reply.code(400).send({ error: 'nome_escritorio e nome_advogado são obrigatórios' });
    }

    const instance =
      body.evolution_instance || `${slugify(body.nome_escritorio)}-${Date.now().toString(36)}`;

    try {
      // 1. Cria a instância no Evolution (webhook já configurado)
      await createInstance(instance);

      // 2. Persiste o tenant
      const tenant = await createTenant({
        nome_escritorio: body.nome_escritorio,
        nome_advogado: body.nome_advogado,
        nome_assistente: body.nome_assistente?.trim() || 'Júria',
        areas: body.areas ?? [],
        tom: body.tom ?? 'cordial, profissional e acolhedor',
        instrucoes_customizadas: body.instrucoes_customizadas ?? '',
        criterios_qualificacao: body.criterios_qualificacao ?? '',
        horario_atendimento: body.horario_atendimento ?? 'Segunda a sexta, das 9h às 18h',
        whatsapp_advogado: body.whatsapp_advogado ?? null,
        evolution_instance: instance,
      });

      // 3. Busca o QR Code de conexão
      const qr = await connectInstance(instance);

      return reply.send({
        tenant: { id: tenant.id, evolution_instance: instance },
        // qr.base64 / qr.code dependendo da versão da Evolution — devolvemos tudo.
        qrcode: qr,
        instrucao: 'Peça ao advogado para escanear o QR Code no WhatsApp > Aparelhos conectados.',
      });
    } catch (err) {
      logger.error({ err, instance }, 'Falha no onboarding do tenant');
      return reply.code(500).send({ error: 'falha ao criar tenant', detalhe: String(err) });
    }
  });

  // Listar todos os advogados (tenants)
  app.get('/admin/tenants', async (_req, reply) => {
    const tenants = await listTenants();
    return reply.send({ tenants });
  });

  // Listar leads (opcionalmente filtrando por tenant_id)
  app.get('/admin/leads', async (req, reply) => {
    const { tenant_id } = req.query as { tenant_id?: string };
    const leads = await listLeads(tenant_id);
    return reply.send({ leads });
  });

  // Reemitir QR Code (caso expire antes de conectar)
  app.get('/admin/tenants/:instance/qrcode', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    const qr = await connectInstance(instance);
    return reply.send({ qrcode: qr });
  });

  // Status da conexão do WhatsApp (open = conectado)
  app.get('/admin/tenants/:instance/status', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const state = await connectionState(instance);
    return reply.send(state);
  });
}
