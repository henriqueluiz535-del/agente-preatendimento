import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/client.js';
import { logger } from '../logger.js';
import { login, usuarioPorToken, type CrmUsuario } from '../crm/auth.js';

// Etapas válidas do funil
const ETAPAS = ['novo', 'qualificado', 'reuniao', 'proposta', 'negociacao', 'fechado', 'perdido'];

async function auth(req: FastifyRequest, reply: FastifyReply): Promise<CrmUsuario | null> {
  const header = req.headers.authorization ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  const usuario = await usuarioPorToken(token);
  if (!usuario) {
    reply.code(401).send({ error: 'não autorizado' });
    return null;
  }
  return usuario;
}

export async function crmApiRoutes(app: FastifyInstance): Promise<void> {
  // ---------- Login ----------
  app.post('/api/crm/login', async (req, reply) => {
    const { email, senha } = (req.body ?? {}) as { email?: string; senha?: string };
    if (!email || !senha) return reply.code(400).send({ error: 'informe e-mail e senha' });
    try {
      const result = await login(email, senha);
      if (!result) return reply.code(401).send({ error: 'e-mail ou senha inválidos' });
      const { data: tenant } = await db
        .from('tenants')
        .select('nome_escritorio, nome_advogado')
        .eq('id', result.usuario.tenant_id)
        .maybeSingle();
      return reply.send({
        token: result.token,
        nome: result.usuario.nome ?? tenant?.nome_advogado ?? '',
        escritorio: tenant?.nome_escritorio ?? '',
      });
    } catch (err) {
      logger.error({ err }, 'Erro no login do CRM');
      return reply.code(500).send({ error: 'erro interno' });
    }
  });

  // ---------- Leads ----------
  app.get('/api/crm/leads', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { data, error } = await db
      .from('leads')
      .select('*, conversations(contato, nome_contato, status)')
      .eq('tenant_id', u.tenant_id)
      .order('updated_at', { ascending: false })
      .limit(500);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ leads: data });
  });

  app.post('/api/crm/leads', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const b = (req.body ?? {}) as any;
    if (!b.nome) return reply.code(400).send({ error: 'nome é obrigatório' });
    const { data, error } = await db
      .from('leads')
      .insert({
        tenant_id: u.tenant_id,
        nome: b.nome,
        area_juridica: b.area_juridica ?? null,
        resumo_caso: b.resumo_caso ?? null,
        origem: b.origem ?? 'indicação',
        etapa: 'qualificado',
        qualificado: true,
        dados: b.contato ? { contato_manual: b.contato } : {},
      })
      .select('*')
      .single();
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ lead: data });
  });

  app.patch('/api/crm/leads/:id', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as any;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.etapa !== undefined) {
      if (!ETAPAS.includes(b.etapa)) return reply.code(400).send({ error: 'etapa inválida' });
      patch.etapa = b.etapa;
    }
    for (const campo of ['notas', 'origem', 'nome', 'area_juridica', 'urgencia', 'motivo_perda'] as const) {
      if (b[campo] !== undefined) patch[campo] = b[campo];
    }
    const { error } = await db.from('leads').update(patch).eq('id', id).eq('tenant_id', u.tenant_id);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ ok: true });
  });

  // Conversa completa de um lead (mensagens da Júria)
  app.get('/api/crm/leads/:id/mensagens', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { id } = req.params as { id: string };
    const { data: lead, error: e1 } = await db
      .from('leads')
      .select('conversation_id')
      .eq('id', id)
      .eq('tenant_id', u.tenant_id)
      .maybeSingle();
    if (e1) return reply.code(500).send({ error: e1.message });
    if (!lead?.conversation_id) return reply.send({ mensagens: [] });
    const { data, error } = await db
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', lead.conversation_id)
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ mensagens: data });
  });

  // ---------- Eventos (agenda) ----------
  app.get('/api/crm/eventos', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { de, ate } = req.query as { de?: string; ate?: string };
    let q = db.from('crm_eventos').select('*, leads(nome)').eq('tenant_id', u.tenant_id).order('inicio');
    if (de) q = q.gte('inicio', de);
    if (ate) q = q.lte('inicio', ate);
    const { data, error } = await q.limit(500);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ eventos: data });
  });

  app.post('/api/crm/eventos', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const b = (req.body ?? {}) as any;
    if (!b.titulo || !b.inicio) return reply.code(400).send({ error: 'título e início são obrigatórios' });
    const { data, error } = await db
      .from('crm_eventos')
      .insert({
        tenant_id: u.tenant_id,
        lead_id: b.lead_id ?? null,
        tipo: b.tipo === 'followup' ? 'followup' : 'reuniao',
        titulo: b.titulo,
        inicio: b.inicio,
        local: b.local ?? 'Meet',
        notas: b.notas ?? '',
      })
      .select('*')
      .single();
    if (error) return reply.code(500).send({ error: error.message });
    // Se veio de um lead, avança a etapa para "reuniao" (sem regredir)
    if (b.lead_id && b.tipo !== 'followup') {
      await db
        .from('leads')
        .update({ etapa: 'reuniao', updated_at: new Date().toISOString() })
        .eq('id', b.lead_id)
        .eq('tenant_id', u.tenant_id)
        .in('etapa', ['novo', 'qualificado']);
    }
    return reply.send({ evento: data });
  });

  app.patch('/api/crm/eventos/:id', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { id } = req.params as { id: string };
    const b = (req.body ?? {}) as any;
    const patch: Record<string, unknown> = {};
    for (const c of ['titulo', 'inicio', 'local', 'notas', 'tipo', 'concluido', 'status'] as const) {
      if (b[c] !== undefined) patch[c] = b[c];
    }
    const { error } = await db.from('crm_eventos').update(patch).eq('id', id).eq('tenant_id', u.tenant_id);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ ok: true });
  });

  app.delete('/api/crm/eventos/:id', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { id } = req.params as { id: string };
    const { error } = await db.from('crm_eventos').delete().eq('id', id).eq('tenant_id', u.tenant_id);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ ok: true });
  });

  // ---------- Fechamentos (honorários) ----------
  app.post('/api/crm/fechamentos', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const b = (req.body ?? {}) as any;
    if (!b.lead_id) return reply.code(400).send({ error: 'lead_id é obrigatório' });
    const { data, error } = await db
      .from('crm_fechamentos')
      .insert({
        tenant_id: u.tenant_id,
        lead_id: b.lead_id,
        honorario_inicial: Number(b.honorario_inicial ?? 0) || 0,
        inicial_recebido: Number(b.inicial_recebido ?? 0) || 0,
        parcelas: b.parcelas ?? '',
        honorario_final_estimado: Number(b.honorario_final_estimado ?? 0) || 0,
        origem: b.origem ?? 'anúncio',
      })
      .select('*')
      .single();
    if (error) return reply.code(500).send({ error: error.message });
    await db
      .from('leads')
      .update({ etapa: 'fechado', origem: b.origem ?? 'anúncio', updated_at: new Date().toISOString() })
      .eq('id', b.lead_id)
      .eq('tenant_id', u.tenant_id);
    return reply.send({ fechamento: data });
  });

  // ---------- Origens personalizadas ----------
  app.get('/api/crm/origens', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { data, error } = await db.from('crm_origens').select('nome').eq('tenant_id', u.tenant_id).order('nome');
    if (error) return reply.code(500).send({ error: error.message });
    const custom = (data ?? []).map((o: any) => o.nome);
    return reply.send({ origens: ['anúncio', 'indicação', ...custom] });
  });

  app.post('/api/crm/origens', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { nome } = (req.body ?? {}) as { nome?: string };
    if (!nome?.trim()) return reply.code(400).send({ error: 'nome é obrigatório' });
    const { error } = await db
      .from('crm_origens')
      .upsert({ tenant_id: u.tenant_id, nome: nome.trim().toLowerCase() }, { onConflict: 'tenant_id,nome' });
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ ok: true });
  });

  // ---------- Dashboard ----------
  app.get('/api/crm/dashboard', async (req, reply) => {
    const u = await auth(req, reply);
    if (!u) return;
    const { dias } = req.query as { dias?: string };
    const nDias = Math.min(Math.max(Number(dias) || 7, 1), 90);
    const de = new Date(Date.now() - nDias * 86400_000);
    const deISO = de.toISOString();
    const agora = new Date();

    try {
      const [leadsQ, eventosQ, fechQ, conversasQ] = await Promise.all([
        db.from('leads').select('id, etapa, created_at, origem').eq('tenant_id', u.tenant_id).gte('created_at', deISO),
        db.from('crm_eventos').select('*, leads(nome)').eq('tenant_id', u.tenant_id),
        db.from('crm_fechamentos').select('*').eq('tenant_id', u.tenant_id).gte('created_at', deISO),
        db
          .from('conversations')
          .select('created_at, ultimo_contato_lead')
          .eq('tenant_id', u.tenant_id)
          .gte('created_at', deISO),
      ]);
      const leads = leadsQ.data ?? [];
      const eventos = eventosQ.data ?? [];
      const fech = fechQ.data ?? [];
      const conversas = conversasQ.data ?? [];

      // Série de leads por dia
      const serie: { dia: string; total: number }[] = [];
      for (let i = nDias - 1; i >= 0; i--) {
        const d = new Date(agora.getTime() - i * 86400_000);
        const chave = d.toISOString().slice(0, 10);
        const total = leads.filter((l: any) => (l.created_at ?? '').slice(0, 10) === chave).length;
        serie.push({ dia: chave, total });
      }

      // Status efetivo de um evento (compatível com registros antigos sem coluna status)
      const statusEv = (e: any): string => e.status ?? (e.concluido ? 'realizada' : 'pendente');
      const soReunioes = eventos.filter((e: any) => e.tipo !== 'followup');

      // Próximos eventos (7 dias) — inclui follow-ups para os lembretes do painel
      const emSeteDias = new Date(agora.getTime() + 7 * 86400_000);
      const reunioesFuturas = eventos
        .filter((e: any) => statusEv(e) === 'pendente' && new Date(e.inicio) >= agora && new Date(e.inicio) <= emSeteDias)
        .sort((a: any, b: any) => a.inicio.localeCompare(b.inicio))
        .slice(0, 12);
      const reunioesAgendadas = soReunioes.filter(
        (e: any) => statusEv(e) === 'pendente' && new Date(e.inicio) >= agora,
      ).length;
      const reuniaoRealizada = (e: any): boolean =>
        statusEv(e) !== 'nao_compareceu' && (e.concluido || statusEv(e) === 'realizada' || new Date(e.inicio) < agora);
      const reunioesRealizadas = soReunioes.filter((e: any) => reuniaoRealizada(e) && new Date(e.inicio) >= de).length;

      // Tempo médio de triagem (1º ao último contato do lead)
      const duracoes = conversas
        .map((c: any) => new Date(c.ultimo_contato_lead ?? c.created_at).getTime() - new Date(c.created_at).getTime())
        .filter((ms: number) => ms > 0 && ms < 6 * 3600_000);
      const tempoMedioMin = duracoes.length
        ? Math.round(duracoes.reduce((a: number, b: number) => a + b, 0) / duracoes.length / 60000)
        : 0;

      // Séries diárias: vendas (R$ de honorários iniciais fechados) e reuniões realizadas
      const serieVendas: { dia: string; total: number }[] = [];
      const serieReunioes: { dia: string; total: number }[] = [];
      for (let i = nDias - 1; i >= 0; i--) {
        const d = new Date(agora.getTime() - i * 86400_000);
        const chave = d.toISOString().slice(0, 10);
        serieVendas.push({
          dia: chave,
          total: fech
            .filter((f: any) => (f.created_at ?? '').slice(0, 10) === chave)
            .reduce((acc: number, f: any) => acc + Number(f.honorario_inicial ?? 0), 0),
        });
        serieReunioes.push({
          dia: chave,
          total: soReunioes.filter((e: any) => reuniaoRealizada(e) && (e.inicio ?? '').slice(0, 10) === chave).length,
        });
      }

      // Honorários
      const soma = (campo: string) => fech.reduce((acc: number, f: any) => acc + Number(f[campo] ?? 0), 0);
      // Origem dos fechamentos
      const origemCont: Record<string, number> = {};
      for (const f of fech as any[]) origemCont[f.origem ?? 'anúncio'] = (origemCont[f.origem ?? 'anúncio'] ?? 0) + 1;

      return reply.send({
        periodo_dias: nDias,
        kpis: {
          leads_novos: leads.length,
          em_triagem: leads.filter((l: any) => l.etapa === 'novo').length,
          reunioes_agendadas: reunioesAgendadas,
          reunioes_realizadas: reunioesRealizadas,
          fechadas: fech.length,
          tempo_medio_min: tempoMedioMin,
        },
        serie,
        serie_vendas: serieVendas,
        serie_reunioes: serieReunioes,
        reunioes_semana: reunioesFuturas,
        honorarios: {
          inicial_total: soma('honorario_inicial'),
          inicial_recebido: soma('inicial_recebido'),
          finais_estimados: soma('honorario_final_estimado'),
          contratos: fech.length,
        },
        origens: origemCont,
      });
    } catch (err) {
      logger.error({ err }, 'Erro no dashboard do CRM');
      return reply.code(500).send({ error: 'erro interno' });
    }
  });
}
