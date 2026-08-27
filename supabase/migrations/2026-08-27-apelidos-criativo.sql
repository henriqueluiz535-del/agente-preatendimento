-- Apelidos dos criativos no relatório "Desempenho dos anúncios".
-- O gestor de tráfego renomeia o criativo no painel (ex: "AD 01 — vídeo no
-- carro") e o apelido vale para toda a equipe. A chave é o ID do anúncio no
-- Meta (ou o rótulo do grupo, quando o clique veio sem ID).
create table if not exists criativo_apelidos (
  chave text primary key,
  apelido text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
