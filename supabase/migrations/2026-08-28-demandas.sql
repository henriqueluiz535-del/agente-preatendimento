-- ============================================================
-- Migração: Demandas com prazos (Kanban do CRM)
-- Rode este SQL no editor do Supabase.
-- ============================================================

create table if not exists crm_demandas (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  lead_id      uuid references leads(id) on delete set null,
  titulo       text not null,
  descricao    text default '',
  responsavel  text default '',
  prazo        date,                                -- vencida = prazo < hoje e não concluída
  status       text not null default 'a_fazer',     -- a_fazer | em_andamento | concluida
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  concluida_em timestamptz
);
create index if not exists idx_crm_demandas_tenant on crm_demandas(tenant_id, status, prazo);
