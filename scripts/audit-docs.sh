#!/usr/bin/env bash
# audit-docs.sh
#
# Auditoria profunda do sistema SPEC-driven v2.
#
# Uso:
#   bash scripts/audit-docs.sh            # audit geral
#   bash scripts/audit-docs.sh --pr       # modo PR (verifica R.7/R4: features atualizadas ao arquivar)
#
# Exit code: 0 = OK, 1 = bloqueio (R.7 violado ou falha crítica).

set -uo pipefail

MODE="general"
if [ "${1:-}" = "--pr" ]; then
  MODE="pr"
fi

BLOCKERS=0
WARN=0

block() {
  echo "🚫 BLOQUEIO: $1" >&2
  BLOCKERS=$((BLOCKERS+1))
}

warn() {
  echo "⚠️  WARN: $1" >&2
  WARN=$((WARN+1))
}

info() {
  echo "ℹ️  $1"
}

# ---------------------------------------------------------------------------
# 1. SPECs referenciadas que não existem (zero fantasma)
# ---------------------------------------------------------------------------
# Qualquer menção "SPEC-YYYYMMDD-HHMM-slug" em algum .md deve corresponder
# a pasta existente em active/future/archive/discard.

all_specs=$(find docs/active docs/future docs/archive docs/discard -maxdepth 1 -type d -name 'SPEC-*' 2>/dev/null | xargs -n1 basename 2>/dev/null | sort -u)

for f in $(find docs -name "*.md" 2>/dev/null); do
  # pega menções SPEC-YYYYMMDD-HHMM(-slug)? no corpo
  mentions=$(grep -oE 'SPEC-[0-9]{8}-[0-9]{4}(-[a-z0-9-]+)?' "$f" 2>/dev/null | sort -u || true)
  for m in $mentions; do
    # Se não corresponde a slug completo, pode ser só o ID sem slug — match relaxado
    if ! echo "$all_specs" | grep -qE "^${m}(-|$)"; then
      warn "$f cita $m, mas não foi encontrada pasta correspondente em active/future/archive/discard"
    fi
  done
done

# ---------------------------------------------------------------------------
# 2. SPECs em active/ há mais de 30 dias sem mudança em state.md
# ---------------------------------------------------------------------------
if [ -d "docs/active" ]; then
  for specdir in docs/active/SPEC-*/; do
    [ -d "$specdir" ] || continue
    [ -f "$specdir/state.md" ] || continue
    specname=$(basename "$specdir")
    age_days=$(( ( $(date +%s) - $(stat -c %Y "$specdir/state.md" 2>/dev/null || stat -f %m "$specdir/state.md" 2>/dev/null) ) / 86400 ))
    if [ $age_days -gt 30 ]; then
      warn "$specname: state.md sem modificação há $age_days dias (sinal de esquecimento)"
    fi
  done
fi

# ---------------------------------------------------------------------------
# 3. Features sem SPECs relacionadas
# ---------------------------------------------------------------------------
if [ -d "docs/features" ]; then
  for f in docs/features/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)

    # Conta linhas de tabela em "Specs desta feature"
    has_specs=$(awk '
      /^## Specs desta feature/ { flag=1; next }
      /^## / { flag=0 }
      flag && /SPEC-[0-9]{8}-[0-9]{4}/ { count++ }
      END { print count+0 }
    ' "$f")

    if [ "$has_specs" = "0" ]; then
      warn "feature $name: nenhuma SPEC referenciada (possível feature órfã)"
    fi
  done
fi

# ---------------------------------------------------------------------------
# 4. Decisões arquiteturais ativas sem revisão há mais de 180 dias
# ---------------------------------------------------------------------------
# Procura linhas com "[YYYY-MM-DD HH:MM]" em "## Decisões arquiteturais ativas"
# e compara com agora.
today_epoch=$(date +%s)
for f in docs/features/*.md; do
  [ -f "$f" ] || continue
  name=$(basename "$f")

  dates=$(awk '
    /^## Decisões arquiteturais ativas/ { flag=1; next }
    /^## / { flag=0 }
    flag { print }
  ' "$f" | grep -oE '20[0-9]{2}-[0-9]{2}-[0-9]{2}' | sort -u || true)

  for d in $dates; do
    d_epoch=$(date -d "$d" +%s 2>/dev/null || date -jf "%Y-%m-%d" "$d" +%s 2>/dev/null || echo 0)
    if [ "$d_epoch" != "0" ]; then
      age_days=$(( (today_epoch - d_epoch) / 86400 ))
      if [ $age_days -gt 180 ]; then
        warn "$name: decisão de $d sem revisão há $age_days dias (considerar revisar)"
      fi
    fi
  done
done

# ---------------------------------------------------------------------------
# 5. Modo --pr: verifica R.7/R4 — SPEC arquivada implica features atualizadas
# ---------------------------------------------------------------------------
if [ "$MODE" = "pr" ]; then
  # Detecta SPECs que saíram de active/ e entraram em archive/ neste diff
  # Base: HEAD^ (ou ORIG_HEAD)
  BASE="${PR_BASE_SHA:-HEAD^}"

  # SPECs que foram movidas active/ → archive/
  moved_specs=$(git diff --name-status "$BASE"...HEAD 2>/dev/null | \
    awk '$1=="R" || $1~/^R/ { print $2, $3 }' | \
    awk '/docs\/active\/SPEC-/ && /docs\/archive\/SPEC-/ { print $2 }' | \
    sed -E 's|docs/archive/(SPEC-[^/]+)/.*|\1|' | sort -u || true)

  # Alternativa: arquivos que saíram de active/ no diff
  if [ -z "$moved_specs" ]; then
    moved_specs=$(git diff --name-only --diff-filter=D "$BASE"...HEAD 2>/dev/null | \
      grep -oE 'docs/active/SPEC-[0-9]{8}-[0-9]{4}-[a-z0-9-]+' | \
      sed 's|docs/active/||' | sort -u || true)
  fi

  if [ -n "$moved_specs" ]; then
    info "SPECs arquivadas neste PR: $moved_specs"

    for spec in $moved_specs; do
      main="docs/archive/$spec/main.md"
      if [ ! -f "$main" ]; then
        block "SPEC $spec arquivada mas main.md não encontrado em archive/"
        continue
      fi

      # Extrai features da SPEC
      features=$(grep -m1 '^\*\*Features:\*\*' "$main" | sed 's/^\*\*Features:\*\* *//' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | grep -v '^$')

      if [ -z "$features" ]; then
        block "SPEC $spec arquivada mas main.md não declara Features (R.4 violado)"
        continue
      fi

      # Para cada feature, verificar se foi modificada no PR
      for feat in $features; do
        feat_file="docs/features/$feat.md"
        if ! git diff --name-only "$BASE"...HEAD 2>/dev/null | grep -q "^$feat_file$"; then
          block "SPEC $spec arquivada mas docs/features/$feat.md não foi atualizado neste PR (R.7 violado)"
        fi
      done
    done
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo
echo "=============================="
if [ $BLOCKERS -gt 0 ]; then
  echo "🚫 $BLOCKERS bloqueio(s), $WARN aviso(s)"
  exit 1
fi
if [ $WARN -gt 0 ]; then
  echo "⚠️  0 bloqueios, $WARN aviso(s)"
else
  echo "✓ Auditoria OK (0 bloqueios, 0 avisos)"
fi
exit 0
