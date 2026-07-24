-- Modo de atendimento por escritório:
--   'todos'      -> Júria responde qualquer contato novo (padrão)
--   'so_anuncio' -> Júria só responde contatos novos vindos de anúncio
--                   (detecção técnica do Meta + frases do anúncio);
--                   clientes do dia a dia ficam por conta do escritório.
alter table tenants add column if not exists modo_atendimento text not null default 'todos';
-- Frases dos anúncios (separadas por vírgula) usadas como detecção reserva.
alter table tenants add column if not exists frases_anuncio text not null default '';
