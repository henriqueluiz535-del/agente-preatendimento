#!/usr/bin/env bash
# ============================================================
# Auto-deploy da Júria — roda a cada 5 minutos via cron.
#
# Verifica se há código novo publicado no GitHub. Só aplica
# quando o commit mais recente tiver a marca [deploy] na
# mensagem (trava de segurança: o assistente marca apenas
# versões prontas para produção).
#
# Instalação (uma única vez):  bash juria.sh autodeploy
# Log:                         ~/agente-preatendimento/autodeploy.log
# ============================================================
set -u
cd "$(dirname "$0")"

# Evita duas execuções ao mesmo tempo
LOCK=/tmp/juria-autodeploy.lock
exec 9>"$LOCK"
flock -n 9 || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD)
git fetch origin "$BRANCH" --quiet 2>/dev/null || exit 0

LOCAL=$(git rev-parse HEAD)
REMOTO=$(git rev-parse "origin/$BRANCH" 2>/dev/null) || exit 0
[ "$LOCAL" = "$REMOTO" ] && exit 0

# Só aplica se o commit mais recente estiver marcado como pronto
if ! git log -1 --format=%B "$REMOTO" | grep -q '\[deploy\]'; then
  exit 0
fi

echo "[$(date '+%F %T')] Código novo detectado ($(git rev-parse --short "$REMOTO")) — atualizando..." >> autodeploy.log
git pull --ff-only >> autodeploy.log 2>&1
docker compose up -d --build juria >> autodeploy.log 2>&1

# Confere a saúde
i=1
while [ "$i" -le 10 ]; do
  sleep 3
  if curl -sf -m 3 http://127.0.0.1:8080/health 2>/dev/null | grep -q '"ok"'; then
    echo "[$(date '+%F %T')] OK Juria atualizada e no ar." >> autodeploy.log
    exit 0
  fi
  i=$((i + 1))
done
echo "[$(date '+%F %T')] ATENCAO: atualizou mas o health check falhou — verificar com 'bash juria.sh logs'." >> autodeploy.log
