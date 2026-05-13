#!/usr/bin/env bash
#
# run.sh — atalho para rodar os apps em dev mode (sobe watchers).
#
# Uso:
#   ./run.sh                       # backend (default)
#   ./run.sh backend               # backend          (http://localhost:3001)
#   ./run.sh portal                # portal           (http://localhost:3000)
#   ./run.sh backoffice            # backoffice       (http://localhost:5173)
#   ./run.sh all                   # os 3 em paralelo, logs prefixados; Ctrl+C encerra todos
#
#   --seed                         # roda 'npm run seed -w backend' ANTES de subir.
#                                  # Só faz sentido com 'backend' ou 'all' (rejeita
#                                  # com erro pra outros targets). Útil ao editar
#                                  # seeds/tenants.json. Ordem livre:
#                                  #   ./run.sh --seed backend
#                                  #   ./run.sh backend --seed
#                                  #   ./run.sh all --seed
#
# Pressupõe ./setup.sh já rodado (deps instaladas, Postgres+Redis up).
#
set -euo pipefail

# ---- saída colorida ----
if [ -t 1 ]; then
  C_BOLD=$'\033[1m'
  C_GREEN=$'\033[0;32m'
  C_RED=$'\033[0;31m'
  C_NC=$'\033[0m'
else
  C_BOLD=''; C_GREEN=''; C_RED=''; C_NC=''
fi

log() { printf '%s[run]%s %s\n'  "${C_BOLD}"  "${C_NC}" "$*"; }
err() { printf '%s[erro]%s %s\n' "${C_RED}"   "${C_NC}" "$*" >&2; exit 1; }

# ---- sanity ----
if [ ! -f package.json ] || ! grep -q '"name": "wynk-scp"' package.json; then
  err "Rode este script na raiz do repositório wynk-scp (cwd atual: $(pwd))."
fi

usage() {
  cat <<EOF
Uso: ./run.sh [backend | portal | backoffice | all] [--seed]

  (sem args)      Roda o backend (default).
  backend         Roda o backend (Express)        http://localhost:3001
  portal          Roda o portal (Next.js)         http://localhost:3000
  backoffice      Roda o backoffice (Vite+React)  http://localhost:5173
  all             Roda os 3 em paralelo. Logs prefixados [backend], [portal],
                  [backoffice]. Ctrl+C encerra todos.

  --seed          Roda 'npm run seed -w backend' ANTES de subir. Só faz sentido
                  com 'backend' ou 'all' (rejeita com erro pra outros targets).
                  Ordem livre: './run.sh --seed backend' ou './run.sh backend --seed'.

Antes do primeiro run, execute ./setup.sh para instalar deps e subir Postgres+Redis.
EOF
}

# ---- parse args (ordem livre entre target e flags) ----
target=""
do_seed=false

for arg in "$@"; do
  case "${arg}" in
    --seed|--with-seed)
      do_seed=true
      ;;
    -h|--help|help)
      usage
      exit 0
      ;;
    backend|portal|backoffice|all)
      if [ -n "${target}" ] && [ "${target}" != "${arg}" ]; then
        err "Múltiplos targets passados ('${target}' e '${arg}'). Use apenas um."
      fi
      target="${arg}"
      ;;
    *)
      err "Argumento desconhecido: '${arg}'. Use: backend | portal | backoffice | all [--seed] (ou --help)."
      ;;
  esac
done

target="${target:-backend}"

# ---- --seed só faz sentido se target inclui backend ----
if [ "${do_seed}" = true ]; then
  case "${target}" in
    backend|all)
      log "Rodando seed antes de subir o dev server (npm run seed -w backend)..."
      npm run seed -w backend
      ok "Seed concluído."
      ;;
    *)
      err "--seed só faz sentido com 'backend' ou 'all' (target atual: '${target}'). O seed roda no backend, não em portal/backoffice. Use './run.sh --seed backend' ou rode 'npm run seed -w backend' direto."
      ;;
  esac
fi

run_one() {
  local app="$1"
  log "Iniciando ${app} (npm run dev -w ${app})..."
  exec npm run dev -w "${app}"
}

run_all() {
  log "Iniciando backend + portal + backoffice em paralelo. Ctrl+C encerra todos."

  pids=()

  start_with_prefix() {
    local app="$1"
    # 2>&1 junta stderr no stdout; sed prefixa cada linha.
    npm run dev -w "${app}" 2>&1 | sed -u "s/^/[${app}] /" &
    pids+=("$!")
  }

  cleanup() {
    # remove a trap pra evitar recursão se sinal vier de novo durante cleanup
    trap - SIGINT SIGTERM EXIT
    echo ""
    log "Encerrando processos filhos..."
    for pid in "${pids[@]}"; do
      kill "${pid}" 2>/dev/null || true
    done
    wait 2>/dev/null || true
    log "Tudo encerrado."
    exit 0
  }
  trap cleanup SIGINT SIGTERM

  start_with_prefix backend
  start_with_prefix portal
  start_with_prefix backoffice

  wait
}

case "${target}" in
  backend|portal|backoffice)
    run_one "${target}"
    ;;
  all)
    run_all
    ;;
esac
