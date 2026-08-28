-- ============================================================
-- Migração: CRM v1.4 — comentários, demandas recorrentes e foto de perfil
-- Rode este SQL no editor do Supabase.
-- ============================================================

-- Comentários internos em demandas e leads
create table if not exists crm_comentarios (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  demanda_id uuid references crm_demandas(id) on delete cascade,
  lead_id    uuid references leads(id) on delete cascade,
  autor      text default '',
  texto      text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_crm_coment_dem  on crm_comentarios(tenant_id, demanda_id, created_at);
create index if not exists idx_crm_coment_lead on crm_comentarios(tenant_id, lead_id, created_at);

-- Demandas recorrentes: '' (não repete) | 'semanal' | 'mensal'
alter table crm_demandas add column if not exists recorrencia text not null default '';

-- Foto de perfil do usuário do CRM (imagem pequena em data URI)
alter table crm_usuarios add column if not exists foto text;
