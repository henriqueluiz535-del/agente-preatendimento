-- ============================================================
-- Schema do Agente de Pré-atendimento (multi-tenant)
-- Rode este SQL no editor SQL do Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- tenants = cada advogado/escritório atendido pela sua agência
-- ------------------------------------------------------------
create table if not exists tenants (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  ativo                 boolean not null default true,

  nome_escritorio       text not null,
  nome_advogado         text not null,
  -- Nome da assistente virtual (a "personagem" que conversa com o lead).
  nome_assistente       text not null default 'Júria',
  -- Áreas de atuação (ex: {"previdenciario","trabalhista"}).
  -- Se vazio, o agente atende qualquer área.
  areas                 text[] not null default '{}',
  tom                   text not null default 'cordial, profissional e acolhedor',
  instrucoes_customizadas text default '',
  criterios_qualificacao  text default '',
  horario_atendimento     text default 'Segunda a sexta, das 9h às 18h',

  -- Número (com DDI+DDD, ex: 5511999998888) que recebe o aviso de lead qualificado.
  whatsapp_advogado     text,

  -- Nome da instância no Evolution API (1 instância = 1 WhatsApp = 1 tenant).
  evolution_instance    text unique not null
);

-- ------------------------------------------------------------
-- conversations = uma conversa com um lead (contato do WhatsApp)
-- ------------------------------------------------------------
create table if not exists conversations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  contato      text not null,               -- JID/numero do lead
  nome_contato text,
  status       text not null default 'ativo', -- ativo | qualificado | encaminhado | encerrado | pausado
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Follow-up automático (reengajamento de leads que pararam de responder)
  followups_enviados  int not null default 0,
  ultimo_contato_lead timestamptz not null default now(),
  ultimo_followup     timestamptz,

  unique (tenant_id, contato)
);

-- ------------------------------------------------------------
-- messages = histórico de mensagens de cada conversa
-- ------------------------------------------------------------
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null,   -- 'user' (lead) | 'assistant' (IA)
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_messages_conversation on messages(conversation_id, created_at);

-- ------------------------------------------------------------
-- leads = dados estruturados extraídos pela IA (a "ficha" da triagem)
-- ------------------------------------------------------------
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references conversations(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  nome            text,
  area_juridica   text,
  resumo_caso     text,
  urgencia        text,            -- baixa | media | alta
  qualificado     boolean not null default false,
  encaminhado     boolean not null default false,
  dados           jsonb not null default '{}',  -- campos extras da triagem
  updated_at      timestamptz not null default now()
);

create index if not exists idx_leads_tenant on leads(tenant_id, qualificado);
