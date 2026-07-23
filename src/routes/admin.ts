import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { createTenant, getTenantByInstance, listTenants, listLeads, desativarTenant, updateTenant } from '../db/repositories.js';
import { createInstance, connectInstance, connectionState, logoutInstance, deleteInstance } from '../evolution/client.js';
import { criarUsuarioCrm, gerarSenhaAleatoria } from '../crm/auth.js';

interface CriarTenantBody {
  nome_escritorio: string;
  nome_advogado: string;
  nome_assistente?: string;
  email_advogado?: string; // login do CRM (plug and play)
  areas?: string[];
  tom?: string;
  instrucoes_customizadas?: string;
  criterios_qualificacao?: string;
  horario_atendimento?: string;
  whatsapp_advogado?: string;
  evolution_instance?: string;
}

/**
 * Normaliza número de WhatsApp brasileiro: remove tudo que não é dígito e
 * garante o DDI 55 (número local com DDD tem 10-11 dígitos).
 */
function normalizarWhatsapp(n?: string): string | null {
  if (!n) return null;
  const digitos = n.replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
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
        // O nome da assistente é padronizado: Júria em todos os escritórios.
        nome_assistente: 'Júria',
        areas: body.areas ?? [],
        tom: body.tom ?? 'cordial, profissional e acolhedor',
        instrucoes_customizadas: body.instrucoes_customizadas ?? '',
        criterios_qualificacao: body.criterios_qualificacao ?? '',
        horario_atendimento: body.horario_atendimento ?? 'Segunda a sexta, das 9h às 18h',
        whatsapp_advogado: normalizarWhatsapp(body.whatsapp_advogado),
        evolution_instance: instance,
      });

      // 3. Cria o acesso ao CRM (plug and play), se veio e-mail
      let crm: { email: string; senha: string } | null = null;
      if (body.email_advogado?.trim()) {
        const senha = gerarSenhaAleatoria();
        await criarUsuarioCrm(tenant.id, body.email_advogado, senha, body.nome_advogado);
        crm = { email: body.email_advogado.trim().toLowerCase(), senha };
      }

      // 4. Busca o QR Code de conexão
      const qr = await connectInstance(instance);

      return reply.send({
        tenant: { id: tenant.id, evolution_instance: instance },
        // qr.base64 / qr.code dependendo da versão da Evolution — devolvemos tudo.
        qrcode: qr,
        crm,
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

  // Criar/redefinir acesso ao CRM de um tenant já existente
  app.post('/admin/tenants/:instance/crm-user', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const { email } = (req.body ?? {}) as { email?: string };
    if (!email?.trim()) return reply.code(400).send({ error: 'email é obrigatório' });
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    const senha = gerarSenhaAleatoria();
    await criarUsuarioCrm(tenant.id, email, senha, tenant.nome_advogado);
    return reply.send({ crm: { email: email.trim().toLowerCase(), senha } });
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

  // Editar dados cadastrais de um escritório (sem mexer na conexão do WhatsApp).
  app.patch('/admin/tenants/:instance', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const b = (req.body ?? {}) as Partial<CriarTenantBody>;
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    const patch: Record<string, unknown> = {};
    if (b.nome_escritorio?.trim()) patch.nome_escritorio = b.nome_escritorio.trim();
    if (b.nome_advogado?.trim()) patch.nome_advogado = b.nome_advogado.trim();
    if (b.areas !== undefined) patch.areas = b.areas;
    if (b.whatsapp_advogado !== undefined) patch.whatsapp_advogado = normalizarWhatsapp(b.whatsapp_advogado);
    if (b.instrucoes_customizadas !== undefined) patch.instrucoes_customizadas = b.instrucoes_customizadas;
    if (Object.keys(patch).length === 0) return reply.code(400).send({ error: 'nada para atualizar' });
    await updateTenant(tenant.id, patch);
    logger.info({ instance, patch: Object.keys(patch) }, 'Tenant atualizado pelo painel');
    return reply.send({ ok: true });
  });

  // Desconectar o WhatsApp (logout) sem excluir o escritório.
  // Para reconectar, basta gerar um novo QR em "Conectar / QR".
  app.post('/admin/tenants/:instance/disconnect', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    try {
      await logoutInstance(instance);
      return reply.send({ ok: true });
    } catch (err) {
      logger.error({ err, instance }, 'Falha ao desconectar o WhatsApp da instância');
      return reply.code(500).send({ error: 'falha ao desconectar', detalhe: String(err) });
    }
  });

  // Excluir escritório: desconecta o WhatsApp, apaga a instância no Evolution
  // e desativa o tenant. O histórico (leads/conversas) permanece no banco.
  app.delete('/admin/tenants/:instance', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    try {
      await logoutInstance(instance);
    } catch (err) {
      // Instância pode já estar desconectada — segue a exclusão.
      logger.warn({ err, instance }, 'Logout falhou durante exclusão (seguindo)');
    }
    try {
      await deleteInstance(instance);
    } catch (err) {
      logger.warn({ err, instance }, 'Delete da instância falhou durante exclusão (seguindo)');
    }
    await desativarTenant(tenant.id);
    logger.info({ instance, tenant: tenant.nome_escritorio }, 'Escritório excluído (tenant desativado)');
    return reply.send({ ok: true });
  });
}
