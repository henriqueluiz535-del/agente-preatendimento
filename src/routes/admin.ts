import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { createTenant, getTenantByInstance, listTenants, listLeads, listLeadMessages, desativarTenant, updateTenant, resumoCrmTenant, listApelidosCriativo, setApelidoCriativo } from '../db/repositories.js';
import { createInstance, connectInstance, connectionState, logoutInstance, deleteInstance } from '../evolution/client.js';
import { criarUsuarioCrm, gerarSenhaAleatoria } from '../crm/auth.js';
import { gerarConvite } from '../crm/convite.js';
import { loginEquipe, validarTokenEquipe, listarEquipe, criarMembro, removerMembro } from '../painel/equipe.js';

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
  modo_atendimento?: string;
  frases_anuncio?: string;
  somente_crm?: boolean;
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
  // Autenticação nas rotas /admin/*:
  //  - x-admin-key = ADMIN_API_KEY  -> papel "dono" (acesso total)
  //  - x-admin-token = login de equipe -> papel "operador" (sem excluir/
  //    desconectar escritórios e sem gestão de equipe)
  app.addHook('preHandler', async (req, reply) => {
    if (!req.url.startsWith('/admin')) return;
    if (req.url.startsWith('/admin/login')) return; // rota pública de login

    const key = req.headers['x-admin-key'];
    if (key === config.adminApiKey) {
      (req as any).papel = 'dono';
      return;
    }

    const token = req.headers['x-admin-token'];
    if (typeof token === 'string' && token) {
      const membro = await validarTokenEquipe(token);
      if (membro) {
        (req as any).papel = membro.papel;
        if (membro.papel !== 'dono') {
          const excluirTenant = req.method === 'DELETE' && /^\/admin\/tenants\/[^/]+$/.test(req.url);
          const desconectar = req.method === 'POST' && req.url.endsWith('/disconnect');
          const gerirEquipe = req.url.startsWith('/admin/equipe');
          if (excluirTenant || desconectar || gerirEquipe) {
            reply.code(403).send({ error: 'seu acesso não permite esta ação — fale com o administrador' });
            return;
          }
        }
        return;
      }
    }

    reply.code(401).send({ error: 'não autorizado' });
  });

  // Login da equipe (e-mail + senha) — devolve token com validade de 30 dias
  app.post('/admin/login', async (req, reply) => {
    const { email, senha } = (req.body ?? {}) as { email?: string; senha?: string };
    if (!email || !senha) return reply.code(400).send({ error: 'informe e-mail e senha' });
    const r = await loginEquipe(email, senha);
    if (!r) return reply.code(401).send({ error: 'e-mail ou senha inválidos' });
    return reply.send(r);
  });

  // Gestão de equipe (somente dono — o hook bloqueia operadores)
  app.get('/admin/equipe', async (_req, reply) => {
    return reply.send({ equipe: await listarEquipe() });
  });
  app.post('/admin/equipe', async (req, reply) => {
    const { email, nome } = (req.body ?? {}) as { email?: string; nome?: string };
    if (!email?.trim()) return reply.code(400).send({ error: 'email é obrigatório' });
    const senha = await criarMembro(email, nome ?? '');
    logger.info({ email }, 'Membro da equipe criado/redefinido');
    return reply.send({ email: email.trim().toLowerCase(), senha });
  });
  app.delete('/admin/equipe/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await removerMembro(id);
    return reply.send({ ok: true });
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

    // Cliente "Somente CRM": sem WhatsApp e sem Júria — não cria instância no
    // Evolution. O escritório usa apenas o CRM (leads manuais, agenda, funil).
    // Marcado via modo_atendimento='somente_crm' (nenhum webhook chega mesmo,
    // já que não existe número conectado).
    const somenteCrm = body.somente_crm === true;

    try {
      // 1. Cria a instância no Evolution (webhook já configurado)
      if (!somenteCrm) await createInstance(instance);

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
        ...(somenteCrm ? { modo_atendimento: 'somente_crm' } : {}),
      });

      // 3. Cria o acesso ao CRM (plug and play), se veio e-mail
      let crm: { email: string; senha: string } | null = null;
      if (body.email_advogado?.trim()) {
        const senha = gerarSenhaAleatoria();
        await criarUsuarioCrm(tenant.id, body.email_advogado, senha, body.nome_advogado);
        crm = { email: body.email_advogado.trim().toLowerCase(), senha };
      }

      if (somenteCrm) {
        return reply.send({
          tenant: { id: tenant.id, evolution_instance: instance },
          somente_crm: true,
          crm,
          instrucao: 'Escritório criado no modo Somente CRM. Gere o link de convite em "Acesso CRM" no card.',
        });
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

  // Apelidos dos criativos (renomear no relatório de anúncios).
  // Tolerante à migração pendente: sem a tabela, devolve mapa vazio.
  app.get('/admin/criativos/apelidos', async (_req, reply) => {
    try {
      return reply.send({ apelidos: await listApelidosCriativo() });
    } catch (err) {
      logger.warn({ err }, 'Tabela criativo_apelidos indisponível (migração pendente?)');
      return reply.send({ apelidos: {} });
    }
  });
  app.post('/admin/criativos/apelido', async (req, reply) => {
    const { chave, apelido } = (req.body ?? {}) as { chave?: string; apelido?: string };
    if (!chave?.trim()) return reply.code(400).send({ error: 'chave é obrigatória' });
    try {
      await setApelidoCriativo(chave.trim(), apelido ?? '');
      return reply.send({ ok: true });
    } catch (err) {
      logger.error({ err }, 'Falha ao salvar apelido do criativo');
      return reply
        .code(500)
        .send({ error: 'não consegui salvar — a migração dos apelidos já foi rodada no Supabase?' });
    }
  });

  // Resumo do CRM do escritório (acompanhamento da entrega pela agência)
  app.get('/admin/tenants/:instance/crm-resumo', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const { dias } = req.query as { dias?: string };
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    const nDias = Math.min(Math.max(Number(dias) || 30, 1), 365);
    return reply.send(await resumoCrmTenant(tenant.id, nDias));
  });

  // Conversa completa de um lead (ficha aberta no painel)
  app.get('/admin/leads/:id/mensagens', async (req, reply) => {
    const { id } = req.params as { id: string };
    const mensagens = await listLeadMessages(id);
    return reply.send({ mensagens });
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

  // Link de convite para o advogado criar o próprio acesso ao CRM (válido 7 dias)
  app.get('/admin/tenants/:instance/convite', async (req, reply) => {
    const { instance } = req.params as { instance: string };
    const tenant = await getTenantByInstance(instance);
    if (!tenant) return reply.code(404).send({ error: 'tenant não encontrado' });
    const token = gerarConvite(tenant.id);
    const host = req.headers.host ?? 'juria.henriquecerdigital.com';
    return reply.send({ link: `https://${host}/crm?convite=${token}`, validade_dias: 7 });
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
    if (b.modo_atendimento !== undefined) {
      if (!['todos', 'so_anuncio'].includes(b.modo_atendimento)) {
        return reply.code(400).send({ error: 'modo_atendimento inválido' });
      }
      patch.modo_atendimento = b.modo_atendimento;
    }
    if (b.frases_anuncio !== undefined) patch.frases_anuncio = b.frases_anuncio;
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
