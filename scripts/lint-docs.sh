#!/usr/bin/env bash
# lint-docs.sh
#
# Valida o formato dos arquivos de controle do sistema SPEC-driven v2.
#
# Uso:
#   bash scripts/lint-docs.sh
#
# Exit code: 0 = OK, 1 = erro(s) encontrado(s).
# Pode ser usado como pre-commit hook ou step de CI.

set -uo pipefail

ERRORS=0
WARN=0

err() {
  echo "❌ ERRO: $1" >&2
  ERRORS=$((ERRORS+1))
}

warn() {
  echo "⚠️  WARN: $1" >&2
  WARN=$((WARN+1))
}

ok() {
  echo "✓ $1"
}

# ---------------------------------------------------------------------------
# 1. features/*.md — cabeçalhos obrigatórios
# ---------------------------------------------------------------------------
if [ -d "docs/features" ]; then
  for f in docs/features/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f")

    # Título no padrão "# Feature: <nome>"
    grep -q '^# Feature:' "$f" || err "$name: falta título '# Feature: <nome>'"

    # Campos obrigatórios
    for campo in 'Keywords' 'Arquivos principais' 'Resumo'; do
      grep -q "^\*\*${campo}:\*\*" "$f" || err "$name: falta campo obrigatório '**${campo}:**'"
    done

    # Seções obrigatórias
    for sec in 'Specs desta feature' 'Estado atual' 'Decisões arquiteturais ativas'; do
      grep -q "^## ${sec}" "$f" || err "$name: falta seção '## ${sec}'"
    done
  done
fi

# ---------------------------------------------------------------------------
# 2. SPEC-*/main.md — cabeçalhos obrigatórios e 3 arquivos em active/
# ---------------------------------------------------------------------------
for loc in active archive discard; do
  [ -d "docs/$loc" ] || continue
  for specdir in docs/$loc/SPEC-*/; do
    [ -d "$specdir" ] || continue
    specname=$(basename "$specdir")

    # Validar nome no padrão SPEC-YYYYMMDD-HHMM-slug
    if [[ ! "$specname" =~ ^SPEC-[0-9]{8}-[0-9]{4}-[a-z0-9-]+$ ]]; then
      err "$specname: nome não segue padrão SPEC-YYYYMMDD-HHMM-slug"
    fi

    # main.md obrigatório em qualquer localização
    if [ ! -f "$specdir/main.md" ]; then
      err "$specname: falta main.md"
      continue
    fi

    # active/ e archive/ e discard/ precisam de state.md + memory.md
    if [ "$loc" != "future" ]; then
      [ -f "$specdir/state.md" ] || err "$specname: falta state.md"
      [ -f "$specdir/memory.md" ] || err "$specname: falta memory.md"
    fi

    main="$specdir/main.md"

    # Campos obrigatórios de main.md
    for campo in 'Status' 'Criada' 'Keywords' 'Features' 'Resumo'; do
      grep -q "^\*\*${campo}:\*\*" "$main" || err "$specname/main.md: falta '**${campo}:**'"
    done

    # Seções obrigatórias
    for sec in 'Objetivo' 'Escopo' 'Implementação' 'Critério de aceite'; do
      grep -q "^## ${sec}" "$main" || err "$specname/main.md: falta '## ${sec}'"
    done

    # Checkbox obrigatório "Features tocadas"
    if ! grep -qiE '\[[ x]\] +\*?\*?Features? tocadas?' "$main"; then
      err "$specname/main.md: falta checkbox obrigatório 'Features tocadas ... atualizadas' em Critério de aceite"
    fi

    # Status válido
    status=$(grep -m1 '^\*\*Status:\*\*' "$main" | sed 's/^\*\*Status:\*\* *//' | awk '{print $1}')
    if [[ ! "$status" =~ ^(draft|active|done|discarded)$ ]]; then
      err "$specname/main.md: Status '$status' inválido (deve ser draft|active|done|discarded)"
    fi

    # Status coerente com pasta
    case "$loc" in
      active)  [[ "$status" == "active" || "$status" == "draft" ]] || err "$specname: em active/ mas Status=$status";;
      archive) [[ "$status" == "done" ]] || err "$specname: em archive/ mas Status=$status (esperado: done)";;
      discard) [[ "$status" == "discarded" ]] || err "$specname: em discard/ mas Status=$status (esperado: discarded)";;
      future)  [[ "$status" == "draft" ]] || err "$specname: em future/ mas Status=$status (esperado: draft)";;
    esac
  done
done

# ---------------------------------------------------------------------------
# 3. INDEX.md não deve ter sido editado manualmente
# ---------------------------------------------------------------------------
if [ -f "docs/INDEX.md" ]; then
  if ! grep -q 'GERADO AUTOMATICAMENTE' docs/INDEX.md; then
    err "docs/INDEX.md não tem marcador 'GERADO AUTOMATICAMENTE' — pode ter sido editado manualmente"
  fi
fi

# ---------------------------------------------------------------------------
# 4. Checkboxes marcados [x] sem timestamp → warn (difícil de pegar 100%, melhor warn)
# ---------------------------------------------------------------------------
# Padrão aceito:
#   - [x] <texto> (YYYY-MM-DD HH:MM, commit `hash`)
#   - [x] <texto> (YYYY-MM-DD HH:MM)
#   - [x] <texto> (YYYY-MM-DD HH:MM, reviewer: @user)
# Se marcado mas sem (YYYY-MM-DD HH:MM — é erro.
for f in $(find docs -name "*.md" 2>/dev/null); do
  [ -f "$f" ] || continue
  while IFS= read -r line; do
    if [[ "$line" =~ ^-[[:space:]]*\[x\] ]]; then
      if [[ ! "$line" =~ \(20[0-9]{2}-[0-9]{2}-[0-9]{2}\ [0-9]{2}:[0-9]{2} ]]; then
        warn "$f: checkbox marcado sem timestamp: $line"
      fi
    fi
  done < "$f"
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo
echo "=============================="
if [ $ERRORS -gt 0 ]; then
  echo "❌ $ERRORS erro(s), $WARN aviso(s)"
  exit 1
fi
if [ $WARN -gt 0 ]; then
  echo "⚠️  0 erros, $WARN aviso(s)"
else
  echo "✓ Lint OK (0 erros, 0 avisos)"
fi
exit 0
