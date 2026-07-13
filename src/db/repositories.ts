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
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
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

export async function markLeadEncaminhado(conversationId: string): Promise<void> {
  const { error } = await db
    .from('leads')
    .update({ encaminhado: true, updated_at: new Date().toISOString() })
    .eq('conversation_id', conversationId);
  if (error) throw error;
}
