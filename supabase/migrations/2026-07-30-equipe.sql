-- Equipe da agência com acesso ao painel da Júria.
-- Papéis: 'operador' (não pode excluir/desconectar escritórios nem gerir equipe).
-- O acesso total continua sendo pela ADMIN_API_KEY (dono).
create extension if not exists pgcrypto;
create table if not exists admin_usuarios (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  senha_hash text not null,
  nome text,
  papel text not null default 'operador',
  created_at timestamptz not null default now()
);
