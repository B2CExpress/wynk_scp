#!/usr/bin/env bash
# generate-index.sh
#
# Gera docs/INDEX.md a partir dos cabeçalhos padronizados de docs/features/*.md.
#
# Uso:
#   bash scripts/generate-index.sh
#
# CI: rodar em push para main quando docs/features/** muda. Após gerar,
# se houver diff, commitar docs/INDEX.md de volta.

set -euo pipefail

INDEX="docs/INDEX.md"
FEATURES_DIR="docs/features"
NOW=$(date +"%Y-%m-%d %H:%M")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "—")

# Extract project name from CLAUDE.md if available
PROJECT_NAME=""
if [ -f "CLAUDE.md" ]; then
  PROJECT_NAME=$(head -1 CLAUDE.md | sed 's/^# CLAUDE.md *— *//' | sed 's/^# *//')
fi

{
  if [ -n "$PROJECT_NAME" ]; then
    echo "# Index — features do projeto $PROJECT_NAME"
  else
    echo "# Index — features do projeto"
  fi
  echo
  echo "> **GERADO AUTOMATICAMENTE.** Edição manual PROIBIDA."
  echo "> Regenerado por \`scripts/generate-index.sh\` a cada push na \`main\`."
  echo ">"
  echo "> Última regeneração: $NOW (commit \`$COMMIT\`)"
  echo
  echo "---"
  echo
  echo "## Features"
  echo

  if [ ! -d "$FEATURES_DIR" ] || [ -z "$(ls -A "$FEATURES_DIR" 2>/dev/null)" ]; then
    echo "_(nenhuma feature criada ainda)_"
  else
    for f in "$FEATURES_DIR"/*.md; do
      [ -f "$f" ] || continue
      name=$(basename "$f" .md)

      # Parse standard header fields
      keywords=$(grep -m1 '^\*\*Keywords:\*\*' "$f" 2>/dev/null | sed 's/^\*\*Keywords:\*\* *//' || echo "—")
      resumo=$(grep -m1 '^\*\*Resumo:\*\*' "$f" 2>/dev/null | sed 's/^\*\*Resumo:\*\* *//' || echo "—")

      # Parse "Arquivos principais" block (all lines between "**Arquivos principais:**" and the next "**" line)
      arquivos=$(awk '
        /^\*\*Arquivos principais:\*\*/ { flag=1; next }
        /^\*\*/ { flag=0 }
        flag { print }
      ' "$f")

      echo "### $name"
      echo
      echo "- **Keywords:** $keywords"
      echo "- **Resumo:** $resumo"
      if [ -n "$arquivos" ]; then
        echo "- **Arquivos principais:**"
        echo "$arquivos" | sed 's/^  /    /'
      fi
      echo "- → [features/$name.md](features/$name.md)"
      echo
    done
  fi
} > "$INDEX"

echo "INDEX.md regenerado em $NOW ($COMMIT)."
