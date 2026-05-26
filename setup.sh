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
#   ./setup.sh             # setup sem seed (volumes preservados)
#   ./setup.sh --seed      # setup e popula tenants de exemplo
#   ./setup.sh --reset     # DESTRUTIVO: 'docker compose down -v' antes (apaga
#                          # pgdata + redisdata). Use quando migrations divergirem
#                          # do snapshot atual do banco. Combinável: '--reset --seed'.
#
set -euo pipefail

# ---- parse flags (ordem livre) ----
do_seed=false
do_reset=false
for arg in "$@"; do
  case "${arg}" in
    --seed|--with-seed) do_seed=true ;;
    --reset|--fresh) do_reset=true ;;
    *) printf '[aviso] Argumento desconhecido ignorado: %s\n' "${arg}" >&2 ;;
  esac
done

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
# Se nenhum estiver presente OU só houver v1 (EOL, bug conhecido KeyError: 'ContainerConfig'),
# tenta auto-instalar o plugin v2 em ~/.docker/cli-plugins/ (per-user, sem sudo).
install_compose_v2_plugin() {
  local arch
  arch="$(uname -m)"
  case "${arch}" in
    x86_64|amd64) arch="x86_64" ;;
    aarch64|arm64) arch="aarch64" ;;
    *)
      warn "Arquitetura '${arch}' não suportada para auto-install do plugin v2. Instale manualmente: https://docs.docker.com/compose/install/"
      return 1
      ;;
  esac
  command -v curl >/dev/null 2>&1 || { warn "curl ausente; pulando auto-install do plugin v2."; return 1; }
  local url="https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${arch}"
  local dest="${HOME}/.docker/cli-plugins/docker-compose"
  log "Baixando Docker Compose v2 plugin (${arch}) para ${dest}..."
  mkdir -p "${HOME}/.docker/cli-plugins"
  if ! curl -fsSL "${url}" -o "${dest}"; then
    warn "Falha ao baixar plugin v2 de ${url}. Sem rede? Instale manualmente."
    rm -f "${dest}"
    return 1
  fi
  chmod +x "${dest}"
  if docker compose version >/dev/null 2>&1; then
    ok "Plugin v2 instalado."
    return 0
  fi
  warn "Plugin v2 baixado mas 'docker compose version' ainda falha. Verifique permissões em ${dest}."
  return 1
}

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
  compose_kind="v2 (plugin)"
elif command -v docker-compose >/dev/null 2>&1 && docker-compose --version 2>&1 | grep -qE '^docker-compose version 1\.'; then
  # v1 detectado: EOL + bug 'ContainerConfig' na recreate. Tenta upgrade pro v2.
  warn "docker-compose v1 detectado (EOL, bug conhecido KeyError 'ContainerConfig'). Tentando instalar plugin v2..."
  if install_compose_v2_plugin && docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
    compose_kind="v2 (plugin, auto-instalado)"
  else
    COMPOSE="docker-compose"
    compose_kind="v1 (legacy, EOL — auto-install do v2 falhou)"
  fi
elif docker-compose --version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
  compose_kind="v1 (legacy, EOL desde jul/2023)"
else
  warn "Docker Compose não encontrado. Tentando instalar plugin v2 automaticamente..."
  if install_compose_v2_plugin && docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
    compose_kind="v2 (plugin, auto-instalado)"
  else
    err "Docker Compose não encontrado e auto-install falhou. Instale uma das duas:
         - Plugin v2 (recomendado): 'sudo apt install docker-compose-plugin' OU baixe de https://github.com/docker/compose/releases para ~/.docker/cli-plugins/docker-compose
         - Legacy v1 (fallback): 'sudo apt install docker-compose'"
  fi
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
# Limpa containers órfãos antes de subir (cobre transição v1→v2 e estados meio-quebrados
# onde 'up' falharia com conflito de nome). Com --reset, apaga TAMBÉM volumes
# (útil quando migrations divergiram do snapshot do banco — ex: coluna que sumiu).
if [ "${do_reset}" = true ]; then
  warn "Modo --reset: apagando containers E volumes (pgdata/redisdata)..."
  ${COMPOSE} down -v --remove-orphans >/dev/null 2>&1 || true
else
  log "Limpando containers órfãos do projeto (${COMPOSE} down --remove-orphans)..."
  ${COMPOSE} down --remove-orphans >/dev/null 2>&1 || true
fi
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
