-- Rastreio de criativo (qual anúncio gerou cada lead).
-- criativo: ID do anúncio (vem nos metadados do clique — Meta CTWA)
-- criativo_titulo: título do anúncio (ajuda a reconhecer no painel)
-- primeira_msg: primeira mensagem do lead (agrupamento reserva quando o
--               clique não traz metadados — ex: mensagens padrão por criativo)
alter table leads add column if not exists criativo text;
alter table leads add column if not exists criativo_titulo text;
alter table leads add column if not exists primeira_msg text;
