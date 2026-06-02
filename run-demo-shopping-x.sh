#!/usr/bin/env bash
#
# run-demo-shopping-x.sh — ambiente de demo completo, ponta a ponta, focado no
# tenant `shopping-x`. Faz TUDO num comando só.
#
# Em ordem:
#   1. Garante a entrada `127.0.0.1 shopping-x.local` no /etc/hosts (sudo se faltar)
#   2. ./setup.sh --seed   -> deps (npm), .env, sobe Postgres+Redis (docker),
#                             schema scp + migrations, e seed dos tenants de exemplo
#   3. npm run seed:demo -w backend -- --tenant=shopping-x
#                             -> conteúdo de demo (lojas, categorias, promoções, notícias)
#   4. Esvazia o cache do Redis (o seed insere direto no banco, não invalida cache)
#   5. ./run.sh all          -> sobe os 3 apps em dev mode
#
# Uso:
#   ./run-demo-shopping-x.sh            # setup idempotente (preserva volumes)
#   ./run-demo-shopping-x.sh --reset    # DESTRUTIVO: recria Postgres+Redis do zero
#
# Depois de subir:
#   - Portal:     http://shopping-x.local:3000   (lojas/eventos do tenant)
#   - Backoffice: http://localhost:5173           (login: admin@shopping-x.local / admin123)
#   - Backend:    http://localhost:3001
#
set -euo pipefail

# ---- saída colorida (sem emojis), alinhada com setup.sh/run.sh ----
if [ -t 1 ]; then
  C_BOLD=$'\033[1m'; C_GREEN=$'\033[0;32m'; C_YELLOW=$'\033[1;33m'; C_RED=$'\033[0;31m'; C_NC=$'\033[0m'
else
  C_BOLD=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_NC=''
fi
log()  { printf '%s[demo]%s %s\n'  "${C_BOLD}"   "${C_NC}" "$*"; }
ok()   { printf '%s[ok]%s %s\n'    "${C_GREEN}"  "${C_NC}" "$*"; }
warn() { printf '%s[aviso]%s %s\n' "${C_YELLOW}" "${C_NC}" "$*"; }
err()  { printf '%s[erro]%s %s\n'  "${C_RED}"    "${C_NC}" "$*" >&2; exit 1; }

TENANT="shopping-x"
HOSTNAME_LOCAL="shopping-x.local"

# ---- parse flags ----
SETUP_RESET=""
for arg in "$@"; do
  case "${arg}" in
    --reset|--fresh) SETUP_RESET="--reset" ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) warn "Argumento desconhecido ignorado: ${arg}" ;;
  esac
done

# ---- 0. sanity: rodar na raiz do repo ----
if [ ! -f package.json ] || ! grep -q '"name": "wynk-scp"' package.json; then
  err "Rode este script na raiz do repositório wynk-scp (cwd atual: $(pwd))."
fi

# ---- detectar docker compose (v2 preferido, v1 fallback) ----
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  DC=""
fi

# ---- 1. /etc/hosts ----
if grep -qE "[[:space:]]${HOSTNAME_LOCAL}(\$|[[:space:]])" /etc/hosts; then
  ok "/etc/hosts já tem ${HOSTNAME_LOCAL}."
else
  log "Adicionando ${HOSTNAME_LOCAL} ao /etc/hosts (pede sudo)..."
  if printf '127.0.0.1\t%s\n' "${HOSTNAME_LOCAL}" | sudo tee -a /etc/hosts >/dev/null; then
    ok "Entrada adicionada: 127.0.0.1 ${HOSTNAME_LOCAL}."
  else
    warn "Não consegui editar /etc/hosts. Adicione manualmente: '127.0.0.1 ${HOSTNAME_LOCAL}'."
  fi
fi

# ---- 2. setup completo (deps + docker + schema/migrations + tenants) ----
#         --seed cria os tenants de exemplo (incl. shopping-x), pré-requisito do
#         demo seed abaixo, que exige o tenant alvo já existindo em tb_tenant.
log "Rodando setup (./setup.sh ${SETUP_RESET} --seed)..."
./setup.sh ${SETUP_RESET} --seed
ok "Setup concluído."

# ---- 3. seed de demo no tenant shopping-x ----
log "Populando conteúdo de demo no tenant '${TENANT}'..."
npm run seed:demo -w backend -- --tenant="${TENANT}"
ok "Seed de demo concluído."

# ---- 4. flush do cache Redis (seed não passa pela API, não invalida cache) ----
if [ -n "${DC}" ]; then
  log "Esvaziando cache do Redis..."
  if ${DC} exec -T redis redis-cli flushall >/dev/null 2>&1; then
    ok "Cache do Redis limpo."
  else
    warn "Não consegui limpar o Redis via compose. Se as lojas vierem vazias, rode '${DC} restart redis'."
  fi
else
  warn "docker compose não encontrado — pulei o flush do Redis."
fi

# ---- 5. subir os apps ----
log "Subindo os apps (./run.sh all). Portal em http://${HOSTNAME_LOCAL}:3000 — Ctrl+C encerra."
exec ./run.sh all
