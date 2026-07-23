#!/usr/bin/env bash
# ============================================================
# Assistente de manutenção da Júria (HENRIQUECER)
# Uso:  bash juria.sh [comando]
#
#   bash juria.sh status        -> mostra se está tudo no ar
#   bash juria.sh logs          -> últimas linhas do log da Júria
#   bash juria.sh atualizar     -> puxa código novo e reconstrói a Júria
#   bash juria.sh reiniciar     -> reinicia a Júria
#   bash juria.sh chave-claude  -> troca a chave da Anthropic (pergunta e valida)
#   bash juria.sh chave-groq    -> troca a chave do Groq (áudio)
#   bash juria.sh modelo        -> alterna o cérebro da Júria (haiku/sonnet)
# ============================================================
set -u
cd "$(dirname "$0")"

# Remove espaços e caracteres invisíveis/estranhos de um valor colado.
limpar() { printf '%s' "$1" | tr -d '[:space:]' | tr -cd '\40-\176'; }

# Substitui (ou adiciona) NOME=VALOR no .env, sem duplicar.
definir_env() {
  local nome="$1" valor="$2"
  touch .env
  grep -v "^${nome}=" .env > .env.tmp || true
  mv .env.tmp .env
  printf '%s=%s\n' "$nome" "$valor" >> .env
}

aplicar_e_conferir() {
  echo "🔄 Aplicando e reiniciando a Júria..."
  docker compose up -d juria >/dev/null 2>&1
  echo "⏳ Aguardando a Júria subir..."
  # Verifica o endpoint de saúde de verdade (até ~30s), em vez de olhar o log.
  local tentativa=1
  while [ "$tentativa" -le 10 ]; do
    if curl -sf -m 3 http://127.0.0.1:8080/health 2>/dev/null | grep -q '"ok"'; then
      echo "✅ Júria no ar! Tudo certo."
      return 0
    fi
    sleep 3
    tentativa=$((tentativa + 1))
  done
  echo "⚠️  A Júria não respondeu ao teste de saúde após 30s. Últimas linhas do log:"
  docker compose logs --tail 15 juria
}

case "${1:-ajuda}" in
  status)
    docker compose ps
    ;;
  logs)
    docker compose logs --tail 40 juria
    ;;
  reiniciar)
    docker compose restart juria && echo "✅ Júria reiniciada."
    ;;
  atualizar)
    echo "⬇️  Baixando código novo..."
    git pull
    echo "🔨 Reconstruindo a Júria (pode levar alguns minutos)..."
    docker compose up -d --build juria
    aplicar_e_conferir
    ;;
  chave-claude)
    printf "Cole a chave da Anthropic (começa com sk-ant-) e aperte Enter:\n> "
    read -r chave
    chave=$(limpar "$chave")
    case "$chave" in
      sk-ant-*) ;;
      *) echo "❌ Isso não parece uma chave válida (deve começar com sk-ant-). Nada foi alterado."; exit 1 ;;
    esac
    definir_env ANTHROPIC_API_KEY "$chave"
    echo "✅ Chave da Anthropic gravada."
    aplicar_e_conferir
    ;;
  chave-groq)
    printf "Cole a chave do Groq (começa com gsk_) e aperte Enter:\n> "
    read -r chave
    chave=$(limpar "$chave")
    case "$chave" in
      gsk_*) ;;
      *) echo "❌ Isso não parece uma chave válida (deve começar com gsk_). Nada foi alterado."; exit 1 ;;
    esac
    definir_env TRANSCRICAO_API_KEY "$chave"
    echo "✅ Chave do Groq gravada."
    aplicar_e_conferir
    ;;
  modelo)
    atual=$(grep '^ANTHROPIC_MODEL=' .env 2>/dev/null | cut -d= -f2)
    echo "Modelo atual: ${atual:-claude-haiku-4-5}"
    echo ""
    echo "  1) claude-haiku-4-5  (mais barato e rápido — recomendado p/ triagem)"
    echo "  2) claude-sonnet-5   (mais inteligente — ~3x o custo)"
    printf "Escolha 1 ou 2 e aperte Enter: "
    read -r opcao
    case "$opcao" in
      1) definir_env ANTHROPIC_MODEL "claude-haiku-4-5"; echo "✅ Modelo: Haiku 4.5" ;;
      2) definir_env ANTHROPIC_MODEL "claude-sonnet-5"; echo "✅ Modelo: Sonnet" ;;
      *) echo "Opção inválida. Nada foi alterado."; exit 1 ;;
    esac
    aplicar_e_conferir
    ;;
  ajuda|*)
    sed -n '2,13p' "$0"
    ;;
esac
