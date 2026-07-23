import { db } from './client.js';
import type { Tenant, Conversation, Message, LeadUpdate } from './types.js';

// ---------- Tenants ----------

export async function getTenantByInstance(instance: string): Promise<Tenant | null> {
  const { data, error } = await db
    .from('tenants')
    .select('*')
    .eq('evolution_instance', instance)
    .eq('ativo', true)
    .maybeSingle();
  if (error) throw error;
  return data as Tenant | null;
}

export async function createTenant(input: Partial<Tenant> & { evolution_instance: string }): Promise<Tenant> {
  const { data, error } = await db.from('tenants').insert(input).select('*').single();
  if (error) throw error;
  return data as Tenant;
}

export async function listTenants(): Promise<any[]> {
  const { data, error } = await db
    .from('tenants')
    .select('id, nome_escritorio, nome_advogado, nome_assistente, areas, whatsapp_advogado, evolution_instance, ativo, created_at')
    .eq('ativo', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Atualiza dados cadastrais de um tenant (nome, advogado, áreas, aviso). */
export async function updateTenant(tenantId: string, patch: Partial<Tenant>): Promise<void> {
  const { error } = await db.from('tenants').update(patch).eq('id', tenantId);
  if (error) throw error;
}

/**
 * Desativa (soft delete) um tenant: a Júria para de atender, o escritório
 * some do painel, mas o histórico (leads, conversas) permanece no banco.
 */
export async function desativarTenant(tenantId: string): Promise<void> {
  const { error } = await db.from('tenants').update({ ativo: false }).eq('id', tenantId);
  if (error) throw error;
}

export async function listLeads(tenantId?: string): Promise<any[]> {
  let query = db
    .from('leads')
    .select('*, conversations(contato, nome_contato, status)')
    .order('updated_at', { ascending: false })
    .limit(200);
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ---------- Conversations ----------

export async function getOrCreateConversation(
  tenantId: string,
  contato: string,
  nomeContato?: string | null,
): Promise<Conversation> {
  const { data: existing, error: selErr } = await db
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('contato', contato)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as Conversation;

  const { data, error } = await db
    .from('conversations')
    .insert({ tenant_id: tenantId, contato, nome_contato: nomeContato ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function setConversationStatus(conversationId: string, status: string): Promise<void> {
  const { error } = await db
    .from('conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) throw error;
}

/** Marca atividade do lead: zera o ciclo de follow-ups e atualiza o timestamp. */
export async function touchLeadActivity(conversationId: string): Promise<void> {
  const { error } = await db
    .from('conversations')
    .update({
      ultimo_contato_lead: new Date().toISOString(),
      followups_enviados: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw error;
}

/**
 * Pausa a conversa de um contato (advogado assumiu o atendimento manualmente).
 * pausadoAte: até quando a pausa vale (ISO) — null = pausa sem prazo (#pausar).
 * Se já estiver pausada, apenas renova a janela.
 * Retorna o id da conversa afetada, ou null se não existe conversa.
 */
export async function pauseConversationByContact(
  tenantId: string,
  contato: string,
  pausadoAte: string | null,
): Promise<string | null> {
  const { data, error } = await db
    .from('conversations')
    .select('id, status')
    .eq('tenant_id', tenantId)
    .eq('contato', contato)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { error: updErr } = await db
    .from('conversations')
    .update({ status: 'pausado', pausado_ate: pausadoAte, updated_at: new Date().toISOString() })
    .eq('id', data.id);
  if (updErr) throw updErr;
  return data.id;
}

/** Devolve a conversa para a Júria (#voltar). Retorna o id, ou null se não existe. */
export async function resumeConversationByContact(tenantId: string, contato: string): Promise<string | null> {
  const { data, error } = await db
    .from('conversations')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('contato', contato)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { error: updErr } = await db
    .from('conversations')
    .update({ status: 'ativo', pausado_ate: null, updated_at: new Date().toISOString() })
    .eq('id', data.id);
  if (updErr) throw updErr;
  return data.id;
}

/** Conversas candidatas a follow-up (ativas/encaminhadas, ciclo não esgotado). */
export async function listFollowupCandidates(maxFollowups: number): Promise<any[]> {
  const { data, error } = await db
    .from('conversations')
    .select('*')
    .in('status', ['ativo', 'encaminhado'])
    .lt('followups_enviados', maxFollowups)
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

/** Última mensagem de uma conversa (para saber se o lead está sem responder). */
export async function getLastMessage(conversationId: string): Promise<Message | null> {
  const { data, error } = await db
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Message) ?? null;
}

/** Registra que o follow-up de número N foi enviado. */
export async function registerFollowupSent(conversationId: string, n: number): Promise<void> {
  const { error } = await db
    .from('conversations')
    .update({
      followups_enviados: n,
      ultimo_followup: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const { data, error } = await db
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .eq('ativo', true)
    .maybeSingle();
  if (error) throw error;
  return data as Tenant | null;
}

// ---------- Messages ----------

export async function addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const { error } = await db.from('messages').insert({ conversation_id: conversationId, role, content });
  if (error) throw error;
}

export async function getRecentMessages(conversationId: string, limit = 30): Promise<Message[]> {
  const { data, error } = await db
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Message[]).reverse();
}

// ---------- Leads ----------

export async function upsertLead(
  conversationId: string,
  tenantId: string,
  update: LeadUpdate,
): Promise<void> {
  const { error } = await db
    .from('leads')
    .upsert(
      {
        conversation_id: conversationId,
        tenant_id: tenantId,
        ...update,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'conversation_id' },
    );
  if (error) throw error;
}

/** Garante que existe uma linha de lead para a conversa (etapa "novo" no funil). */
export async function ensureLead(conversationId: string, tenantId: string, nome?: string | null): Promise<void> {
  const { error } = await db
    .from('leads')
    .upsert(
      { conversation_id: conversationId, tenant_id: tenantId, ...(nome ? { nome } : {}) },
      { onConflict: 'conversation_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

/** Avança a etapa do funil para "qualificado" (sem regredir etapas movidas pelo advogado). */
export async function marcarEtapaQualificado(conversationId: string): Promise<void> {
  const { error } = await db
    .from('leads')
    .update({ etapa: 'qualificado', updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('etapa', 'novo');
  if (error) throw error;
}

export async function markLeadEncaminhado(conversationId: string): Promise<void> {
  const { error } = await db
    .from('leads')
    .update({ encaminhado: true, updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId);
  if (error) throw error;
}
