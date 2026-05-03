---
name: spec-system-init
description: Initialize the SPEC-driven documentation system v2 (features-based) in a workspace. Creates docs/ (RULES.md, INDEX.md, features/, active/, future/, archive/, discard/) and scripts/ (generate-index.sh, lint-docs.sh, audit-docs.sh). Creates or updates CLAUDE.md at project root to orient AI. Use when the user says "inicializar sistema de documentação", "setup specs", "init doc system", "bootstrap docs", or is starting a new project that needs disciplined spec-based documentation.
version: v2
---

# spec-system-init v2

Inicializa o sistema de documentação SPEC-driven **v2 (features-based)** no workspace atual.

Principais diferenças da v1:
- IDs de SPEC são **timestamp** (`SPEC-YYYYMMDD-HHMM-slug`), não sequenciais
- Cada SPEC vive em uma **pasta** com 3 arquivos (`main.md` + `state.md` + `memory.md`)
- **`docs/features/`** substitui `memory.md` raiz como índice vivo por área
- **`docs/INDEX.md`** gerado por CI a partir dos cabeçalhos das features
- **Zero `memory.md`/`history.md` raiz** — conteúdo migra para features/ e SPECs
- Scripts de apoio criados em `scripts/` (`generate-index.sh`, `lint-docs.sh`, `audit-docs.sh`)
- **Invariante:** `docs/active/` em `main` é sempre vazio (SPECs ativas vivem em branches)
- Regras imperativas (DEVE/PROIBIDO/OBRIGATÓRIO) com mitigações de riscos R1-R4

## Quando disparar

Sinais de intenção do usuário:
- "inicialize/inicializar o sistema de documentação"
- "setup/bootstrap specs"
- "init doc system"
- "criar a estrutura de documentação"
- "começar novo projeto com specs"

## O que esta skill cria

```
<workspace-root>/
├── CLAUDE.md                          ← criado ou mesclado
├── scripts/
│   ├── generate-index.sh
│   ├── lint-docs.sh
│   └── audit-docs.sh
└── docs/
    ├── RULES.md                       ← processo completo (imperativo)
    ├── INDEX.md                       ← template inicial (será preenchido pelo CI)
    ├── features/                      ← vazia (populada quando SPECs criarem features)
    ├── active/                        ← vazia (SPECs ativas vivem em branches)
    ├── future/                        ← vazia
    ├── archive/                       ← vazia
    └── discard/                       ← vazia
```

## Execução

### Step 1 — Inspecionar estado atual

Usar Bash `ls` e Read com try-catch para detectar:
- `docs/` já existe? → **PARAR**. Perguntar: "Já existe `docs/`. Abortar (A) ou continuar mesclando (M)?" Default: abortar.
- `CLAUDE.md` no root existe? → marcar para MERGE (append-section), não sobrescrever.
- `scripts/` já existe? → se sim, não sobrescrever scripts homônimos; apenas adicionar os que faltam e avisar.
- Diretório de trabalho atual = target workspace root.

### Step 2 — Auto-analisar projeto (NÃO perguntar o que já está documentado)

**ANTES de fazer qualquer pergunta**, ler o que já existe no workspace para inferir valores dos placeholders. O usuário não deve redigitar o que já está documentado.

**Fontes de inferência (tentar nesta ordem, parar ao achar):**

**Nome do projeto (`{{PROJECT_NAME}}`):**
1. `CLAUDE.md` → primeiro heading `# CLAUDE.md — <NAME>` ou `# <NAME>`
2. `README.md` / `readme.md` → primeiro `# heading`
3. `package.json` → `"name"` (se monorepo, usar nome root ou pedir confirmação)
4. `pyproject.toml` → `[project] name` ou `[tool.poetry] name`
5. `Cargo.toml` → `[package] name`
6. `go.mod` → `module <name>` (última parte após `/`)
7. `composer.json` → `"name"`
8. `Gemfile` / `*.gemspec` → padrão específico
9. Fallback: nome da pasta-raiz (basename do cwd)

**Descrição (`{{PROJECT_DESC}}`):**
1. `CLAUDE.md` → primeiro parágrafo após o heading
2. `README.md` → primeiro parágrafo após o heading (pulando badges)
3. `package.json` → `"description"`
4. `pyproject.toml` → `description`
5. `Cargo.toml` → `description`
6. Fallback: `"_(adicionar descrição)_"`

**Stack (`{{STACK}}`):**
Combinar múltiplas fontes:
1. `package.json` → detectar `"type": "module"`, deps principais (react, vue, svelte, next, nuxt, astro, express, fastify, nest, hono, elysia), devDeps (typescript, vite, webpack). Formar string tipo "Node.js + TypeScript + React + Vite".
2. `pyproject.toml` / `requirements.txt` → Python + frameworks (fastapi, flask, django, pydantic)
3. `Cargo.toml` → Rust + frameworks (axum, actix, rocket, tokio)
4. `go.mod` → Go + libs (gin, echo, fiber)
5. `*.csproj` / `*.sln` → .NET
6. `pom.xml` / `build.gradle` → Java/Kotlin + Spring/etc.
7. `Gemfile` → Ruby + Rails/etc.
8. `Dockerfile` / `docker-compose.yml` → adicionar "Docker"
9. Bancos detectáveis em `.env.example`, `docker-compose.yml`, deps (`mysql2`, `pg`, `mongodb`, `mssql`, `@prisma/client`, `typeorm`)
10. Fallback: analisar extensões de arquivo mais frequentes

**Comandos (`{{DEV_COMMANDS}}`):**
1. `package.json` → `"scripts"`. Selecionar relevantes: `install`/`ci`, `dev`/`start`, `build`, `test`, `lint`.
2. `Makefile` → targets comuns (`install`, `dev`, `test`, `build`, `run`)
3. `pyproject.toml` → `[tool.poetry.scripts]` ou comandos comuns
4. `README.md` → seção "Installation" / "Getting started" — extrair blocos ` ```bash/sh/shell `
5. `CLAUDE.md` → se tiver seção "Comandos" / "Commands", copiar
6. Fallback: bloco placeholder ` ```bash\n# (adicionar comandos)\n``` `

### Step 3 — Apresentar valores detectados e pedir confirmação

Mostrar ao usuário **em UMA mensagem** os valores pré-preenchidos com as fontes, e pedir para confirmar ou editar:

```
Detectei os seguintes valores no workspace:

📦 Nome: <valor>                    (fonte: <arquivo>)
📝 Descrição: <valor>               (fonte: <arquivo>)
🛠️  Stack: <valor>                   (fonte: <arquivo(s)>)
⚡ Comandos:
<bloco>
                                    (fonte: <arquivo>)

Confirme com "ok" ou "tudo certo" para usar esses valores, OU
edite os que quiser ajustar (ex.: "stack: Bun + React + Elysia").
```

Se responder "ok" → prossegue. Se editar um campo → aplica e reusa o resto. Se nenhum achou nada → fazer as 4 perguntas clássicas uma a uma, sinalizando.

### Step 4 — Criar estrutura de pastas

Rodar via Bash:

```bash
mkdir -p docs/features docs/active docs/future docs/archive docs/discard scripts
```

### Step 5 — Escrever arquivos a partir dos templates

Ler cada template de `templates/` dentro da skill e escrever no workspace, substituindo placeholders:

| Template | Destino |
|----------|---------|
| `templates/RULES.md` | `docs/RULES.md` |
| `templates/INDEX.md` | `docs/INDEX.md` |
| `templates/CLAUDE.md` | `CLAUDE.md` (apenas se não existe) |
| `templates/scripts/generate-index.sh` | `scripts/generate-index.sh` |
| `templates/scripts/lint-docs.sh` | `scripts/lint-docs.sh` |
| `templates/scripts/audit-docs.sh` | `scripts/audit-docs.sh` |

**Placeholders a substituir:**

- `{{PROJECT_NAME}}` → detectado
- `{{PROJECT_DESC}}` → detectado
- `{{STACK}}` → detectado
- `{{DEV_COMMANDS}}` → detectado, envolvido em ```` ```bash ... ``` ````
- `{{TODAY}}` → data atual `YYYY-MM-DD`
- `{{NOW}}` → timestamp atual `YYYY-MM-DD HH:MM`

Usar data/hora real do sistema — NUNCA placeholders fictícios (`2024-01-01`, etc.). Se necessário, rodar `date +"%Y-%m-%d %H:%M"` via Bash.

### Step 6 — Tornar scripts executáveis

```bash
chmod +x scripts/generate-index.sh scripts/lint-docs.sh scripts/audit-docs.sh 2>/dev/null || true
```

(Inofensivo em Windows puro; útil em WSL/git bash/Linux/macOS.)

### Step 7 — Tratar `CLAUDE.md` existente (merge mode)

Se `CLAUDE.md` já existe no root:

1. Read atual.
2. Procurar cabeçalho "Primeira coisa" ou "Documentação SPEC-driven" — se existir, avisar que há seção parecida e perguntar se usuário quer sobrescrever.
3. Se não existir: **appendar** (não substituir) seção nova no fim:

   ```markdown
   ## Documentação SPEC-driven v2 — OBRIGATÓRIO

   Antes de qualquer código nesta sessão, ler (nesta ordem):

   1. [docs/RULES.md](docs/RULES.md) — processo completo v2 (imperativo)
   2. [docs/INDEX.md](docs/INDEX.md) — mapa de features do projeto

   Listar `docs/active/` localmente para ver SPECs ativas na branch.

   Resumo do processo:
   - Documentação é para IA, não humanos. Exceção: `main.md` (contrato validado pelo dev).
   - SPEC = pasta `SPEC-<timestamp>-<slug>/` com `main.md` + `state.md` + `memory.md`
   - Toda SPEC se vincula a pelo menos 1 feature (criando se não existir)
   - `docs/active/` em `main` é sempre VAZIO (gate CI). SPECs ativas vivem em branches.
   - Timestamps `YYYY-MM-DD HH:MM` em TODA atualização (checkbox, status, decisão, etc.)
   - Ao arquivar SPEC, features tocadas DEVEM ser atualizadas no mesmo PR (R.7)
   - Protocolo de escalação: Nível 0 (auto) → Nível 1 (sob confirmação) → Nível 2 (sob pergunta) → Nível 3 (casos especiais)

   Fonte da verdade para qualquer dúvida: [docs/RULES.md](docs/RULES.md).
   ```

   Usar Edit tool (old_string = final do arquivo, new_string = final + nova seção).

### Step 8 — Report

Listar em uma única mensagem:
- Arquivos criados (com caminhos)
- Arquivos modificados (se CLAUDE.md foi mesclado)
- Scripts criados e tornados executáveis
- Próximos passos sugeridos:
  - "Revise `CLAUDE.md` e `docs/RULES.md` para detalhes específicos do seu projeto"
  - "Configure CI para rodar `scripts/generate-index.sh` em push/merge na `main` com mudanças em `docs/features/**`"
  - "Configure CI/pre-commit para rodar `scripts/lint-docs.sh` (falha bloqueia commit/PR)"
  - "Configure CI para rodar `scripts/audit-docs.sh --pr` em todos os PRs (bloqueia se R.7 violado)"
  - "Opcional: configurar git hook server-side ou CI check que rejeita merge com mudança em `docs/active/` (invariante R.2)"
  - "Quando tiver o primeiro trabalho, crie `docs/active/SPEC-<timestamp>-<slug>/` com os 3 arquivos (main, state, memory) seguindo formato em `docs/RULES.md §3`"

## Anti-patterns (desta skill)

- ❌ **Sobrescrever** `docs/` ou `CLAUDE.md` existentes sem confirmação
- ❌ Usar timestamps do treinamento em vez de `date` do sistema
- ❌ **Perguntar info que já está em arquivo existente** — sempre inferir de `package.json`, `README.md`, `CLAUDE.md`, etc. antes
- ❌ Apresentar perguntas em branco ou em várias mensagens — mostrar tudo pré-preenchido em uma mensagem
- ❌ Commitar arquivos criados (deixar para o usuário decidir)
- ❌ Criar SPECs ou features de exemplo — pastas ficam vazias; usuário cria conforme demanda
- ❌ Preservar `memory.md` e `history.md` raiz de v1 — v2 migra conteúdo para `features/` e `archive/SPEC-*/`

## Templates location

Os templates ficam em `templates/` ao lado deste SKILL.md:
- [templates/RULES.md](templates/RULES.md)
- [templates/CLAUDE.md](templates/CLAUDE.md)
- [templates/INDEX.md](templates/INDEX.md)
- [templates/scripts/generate-index.sh](templates/scripts/generate-index.sh)
- [templates/scripts/lint-docs.sh](templates/scripts/lint-docs.sh)
- [templates/scripts/audit-docs.sh](templates/scripts/audit-docs.sh)
