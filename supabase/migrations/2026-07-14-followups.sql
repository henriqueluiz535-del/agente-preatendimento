-- Migração: campos de follow-up automático nas conversas.
-- Rode este SQL no editor do Supabase (banco já existente).

alter table conversations add column if not exists followups_enviados int not null default 0;
alter table conversations add column if not exists ultimo_contato_lead timestamptz not null default now();
alter table conversations add column if not exists ultimo_followup timestamptz;
