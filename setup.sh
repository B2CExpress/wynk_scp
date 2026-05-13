#!/usr/bin/env bash
#
# setup.sh — atalho idempotente de setup local do wynk-scp.
#
# Faz: instalar deps (npm), copiar .env.example -> .env (se faltar),
#      subir Postgres+Redis via docker compose, esperar healthy,
#      bootstrap do schema scp + migrations, (opcional) seed.
#
# Não instala pré-requisitos (Node, Docker, Git, etc.) — só verifica.
# Veja README.md (seção "Pré-requisitos") para instalá-los.
#
# Uso:
#   ./setup.sh             # setup sem seed
#   ./setup.sh --seed      # setup e popula tenants de exemplo
#
set -euo pipefail

# ---- saída colorida (sem emojis) ----
if [ -t 1 ]; then
  C_RED=$'\033[0;31m'
  C_GREEN=$'\033[0;32m'
  C_YELLOW=$'\033[1;33m'
  C_BOLD=$'\033[1m'
  C_NC=$'\033[0m'
else
  C_RED=''; C_GREEN=''; C_YELLOW=''; C_BOLD=''; C_NC=''
fi

log()  { printf '%s[setup]%s %s\n'  "${C_BOLD}"   "${C_NC}" "$*"; }
ok()   { printf '%s[ok]%s %s\n'     "${C_GREEN}"  "${C_NC}" "$*"; }
warn() { printf '%s[aviso]%s %s\n'  "${C_YELLOW}" "${C_NC}" "$*"; }
err()  { printf '%s[erro]%s %s\n'   "${C_RED}"    "${C_NC}" "$*" >&2; exit 1; }

# ---- 0. sanity: rodar na raiz do repo ----
if [ ! -f package.json ] || ! grep -q '"name": "wynk-scp"' package.json; then
  err "Rode este script na raiz do repositório wynk-scp (cwd atual: $(pwd))."
fi

# ---- 1. pré-requisitos ----
log "Conferindo pré-requisitos..."

command -v node >/dev/null 2>&1 \
  || err "Node.js não encontrado. Instale Node 22+: https://nodejs.org/en/download"

node_major=$(node -v | sed 's/^v\([0-9]*\).*/\1/')
if [ "${node_major}" -lt 22 ]; then
  err "Node v${node_major} detectado; o projeto exige 22+. Atualize: https://nodejs.org/"
fi

command -v npm >/dev/null 2>&1 \
  || err "npm não encontrado (normalmente vem com o Node)."

command -v git >/dev/null 2>&1 \
  || err "Git não encontrado. Instale: https://git-scm.com/downloads"

command -v docker >/dev/null 2>&1 \
  || err "Docker não encontrado. Instale: https://docs.docker.com/engine/install/"

# Detect Docker Compose flavor (v2 plugin preferido, v1 legacy aceito como fallback).
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
  compose_kind="v2 (plugin)"
elif docker-compose --version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
  compose_kind="v1 (legacy, EOL desde jul/2023)"
else
  err "Docker Compose não encontrado. Instale uma das duas:
       - Plugin v2 (recomendado): 'sudo apt install docker-compose-plugin' OU baixe de https://github.com/docker/compose/releases para ~/.docker/cli-plugins/docker-compose
       - Legacy v1 (fallback): 'sudo apt install docker-compose'"
fi

if ! docker info >/dev/null 2>&1; then
  err "Daemon do Docker não está ativo ou seu usuário não tem permissão. Tente: 'sudo usermod -aG docker \$USER' e reabra o terminal."
fi

ok "Pré-requisitos OK (Node $(node -v), npm $(npm -v), Docker $(docker --version | awk '{print $3}' | sed 's/,$//'), Compose ${compose_kind})."

if [ "${COMPOSE}" = "docker-compose" ]; then
  warn "Usando docker-compose v1 (EOL). Considere migrar para o plugin v2 quando puder: https://docs.docker.com/compose/install/"
fi

# ---- 2. npm install ----
log "Instalando dependências (npm install)..."
npm install
ok "Dependências instaladas."

# ---- 3. arquivos .env ----
log "Configurando arquivos .env..."
for app in backend portal; do
  if [ -f "${app}/.env" ]; then
    ok "${app}/.env já existe (mantido)."
  elif [ -f "${app}/.env.example" ]; then
    cp "${app}/.env.example" "${app}/.env"
    ok "${app}/.env criado a partir de ${app}/.env.example."
  else
    warn "${app}/.env.example não encontrado, pulando."
  fi
done

# ---- 4. docker compose up ----
log "Subindo Postgres + Redis em containers (${COMPOSE} up -d)..."
${COMPOSE} up -d
ok "Containers iniciados (scp_postgres, scp_redis)."

# ---- 5. esperar healthy ----
log "Aguardando containers ficarem 'healthy' (até 60s)..."
deadline=$(($(date +%s) + 60))
while true; do
  pg_status=$(docker inspect --format '{{.State.Health.Status}}' scp_postgres 2>/dev/null || echo "missing")
  rd_status=$(docker inspect --format '{{.State.Health.Status}}' scp_redis 2>/dev/null || echo "missing")

  if [ "${pg_status}" = "healthy" ] && [ "${rd_status}" = "healthy" ]; then
    ok "Postgres e Redis estão healthy."
    break
  fi

  if [ "$(date +%s)" -ge "${deadline}" ]; then
    err "Containers não ficaram healthy em 60s (postgres=${pg_status}, redis=${rd_status}). Veja '${COMPOSE} ps' e '${COMPOSE} logs'."
  fi

  sleep 2
done

# ---- 6. bootstrap do banco ----
log "Bootstrap do banco (schema 'scp' + migrations)..."
npm run db:setup -w backend
ok "Banco pronto (schema criado e migrations aplicadas)."

# ---- 7. seed opcional ----
do_seed=false
for arg in "$@"; do
  case "${arg}" in
    --seed|--with-seed) do_seed=true ;;
    *) warn "Argumento desconhecido ignorado: ${arg}" ;;
  esac
done

if [ "${do_seed}" = true ]; then
  log "Populando tenants de exemplo (npm run seed -w backend)..."
  npm run seed -w backend
  ok "Seed aplicado."
else
  warn "Seed não executado. Para popular tenants de exemplo: 'npm run seed -w backend' (ou rode este script com --seed)."
fi

# ---- 8. resumo final ----
echo ""
printf '%s%sSetup concluído.%s\n' "${C_GREEN}" "${C_BOLD}" "${C_NC}"
echo ""
echo "Para subir os apps em dev mode, use o atalho:"
echo "  ./run.sh                # backend (default)"
echo "  ./run.sh backend        # http://localhost:3001"
echo "  ./run.sh portal         # http://localhost:3000"
echo "  ./run.sh backoffice     # http://localhost:5173"
echo "  ./run.sh all            # os 3 em paralelo, logs prefixados"
echo "  ./run.sh --seed backend # roda seed antes (use ao editar seeds/tenants.json)"
echo ""
echo "Ou manualmente, em terminais separados:"
echo "  npm run dev -w backend"
echo "  npm run dev -w portal"
echo "  npm run dev -w backoffice"
echo ""
echo "Para conferir os containers:"
echo "  ${COMPOSE} ps"
echo ""
