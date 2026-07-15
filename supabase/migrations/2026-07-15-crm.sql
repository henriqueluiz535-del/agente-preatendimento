-- ============================================================
-- Migração: CRM HENRIQUECER (v1)
-- Rode este SQL no editor do Supabase.
-- ============================================================

-- Usuários do CRM (login do advogado/escritório)
create table if not exists crm_usuarios (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  email       text not null unique,
  senha_hash  text not null,
  nome        text,
  created_at  timestamptz not null default now()
);

-- Sessões de login (tokens)
create table if not exists crm_sessoes (
  token       text primary key,
  usuario_id  uuid not null references crm_usuarios(id) on delete cascade,
  expira_em   timestamptz not null
);

-- Origens de lead personalizáveis por escritório
create table if not exists crm_origens (
  id        uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  nome      text not null,
  unique (tenant_id, nome)
);

-- Agenda: reuniões e follow-ups manuais do advogado
create table if not exists crm_eventos (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  lead_id    uuid references leads(id) on delete set null,
  tipo       text not null default 'reuniao',   -- reuniao | followup
  titulo     text not null,
  inicio     timestamptz not null,
  local      text default 'Meet',               -- Meet | presencial | outro
  notas      text default '',
  concluido  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_crm_eventos_tenant on crm_eventos(tenant_id, inicio);

-- Fechamentos (honorários registrados ao ganhar o caso)
create table if not exists crm_fechamentos (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references tenants(id) on delete cascade,
  lead_id                  uuid not null references leads(id) on delete cascade,
  honorario_inicial        numeric not null default 0,
  inicial_recebido         numeric not null default 0,
  parcelas                 text default '',
  honorario_final_estimado numeric not null default 0,
  origem                   text not null default 'anúncio',
  created_at               timestamptz not null default now()
);
create index if not exists idx_crm_fech_tenant on crm_fechamentos(tenant_id, created_at);

-- Extensões na tabela de leads para o funil
alter table leads add column if not exists etapa text not null default 'novo';
  -- etapas: novo | qualificado | reuniao | proposta | negociacao | fechado | perdido
alter table leads add column if not exists origem text not null default 'anúncio';
alter table leads add column if not exists notas text not null default '';
alter table leads add column if not exists created_at timestamptz not null default now();
-- Leads manuais (indicação/parceria) não têm conversa com a Júria
alter table leads alter column conversation_id drop not null;

-- Leads já qualificados antes desta migração entram na etapa certa
update leads set etapa = 'qualificado' where qualificado = true and etapa = 'novo';
