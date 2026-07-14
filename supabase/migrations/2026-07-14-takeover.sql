-- Migração: janela de takeover humano (auto-retomada da Júria).
-- Rode este SQL no editor do Supabase (banco já existente).

alter table conversations add column if not exists pausado_ate timestamptz;
