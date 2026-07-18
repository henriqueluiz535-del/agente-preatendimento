-- CRM v1.1: status de reuniões na agenda e motivo de venda perdida
-- Rodar no SQL Editor do Supabase.

-- Status do evento: pendente | realizada | nao_compareceu
alter table crm_eventos add column if not exists status text not null default 'pendente';
update crm_eventos set status = 'realizada' where concluido = true and status = 'pendente';

-- Motivo registrado quando uma venda é marcada como perdida
alter table leads add column if not exists motivo_perda text;
