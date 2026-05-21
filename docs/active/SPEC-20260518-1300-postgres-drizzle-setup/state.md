# state.md — SPEC-20260518-1915-postgres-drizzle-setup

## TL;DR

**Fase atual:** 1 — aguardando execução pelo dev
**Próxima ação:** `docker compose up -d` na raiz → editar `portal/package.json` cirurgicamente → `npm install` → seguir fases
**Blocker:** nenhum
**Atualizado em:** 2026-05-18 20:00

---

## Tabela de fases

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|------------|--------|
| 1 | Subir Postgres via docker compose (já existente na raiz) | pendente | 2026-05-18 20:00 | — |
| 2 | Edição cirúrgica do portal/package.json + npm install | pendente | 2026-05-18 20:00 | — |
| 3 | Criar portal/src/lib/db/schema.ts | pendente | 2026-05-18 20:00 | — |
| 4 | Criar portal/src/lib/db/index.ts | pendente | 2026-05-18 20:00 | — |
| 5 | Criar portal/drizzle.config.ts + portal/.env.example | pendente | 2026-05-18 20:00 | — |
| 6 | Copiar .env.example → .env no portal/ | pendente | 2026-05-18 20:00 | — |
| 7 | db:generate → db:migrate → db:studio (validar) | pendente | 2026-05-18 20:00 | — |
| 8 | Remover _test do schema.ts + db:generate + db:migrate | pendente | 2026-05-18 20:00 | — |
| 9 | Atualizar feature `infrastructure` + arquivar SPEC | pendente | 2026-05-18 20:00 | — |

---

## Log cronológico (append-only)

### 2026-05-18 19:15 — [criação] SPEC criada, arquivos gerados com paths incorretos

Prompt classificado como: **nova SPEC**.
Arquivos gerados com `lib/db/` na raiz do monorepo — incorreto para este projeto.

### 2026-05-18 19:45 — [correção] Paths corrigidos para portal/

Identificado via imagens da estrutura real do projeto:
- `portal/src/lib/` já existe com `tenant/` e `theme/` — padrão estabelecido
- Não existe `lib/` na raiz do monorepo
- `docker-compose.yml` já existente usa porta 5435, credenciais `scp/scp/scp`

Correções aplicadas:
- `drizzle.config.ts` → `portal/drizzle.config.ts`
- `schema.ts` + `index.ts` → `portal/src/lib/db/`
- `.env.example` → `portal/.env.example` com `DATABASE_URL` porta 5435
- `index.ts` atualizado com padrão `globalThis` (compatibilidade HMR Next.js)
- Decisão: Drizzle exclusivo do `portal/` — `backend/` mantém TypeORM

### 2026-05-18 20:00 — [decisão] Edição cirúrgica do portal/package.json

Dev optou por não substituir o `portal/package.json` inteiro — apenas adicionar
o que falta. Risco de sobrescrever configurações existentes eliminado.

Escopo IN atualizado: "edição cirúrgica" em vez de "substituição".
Escopo OUT atualizado: "substituição completa do portal/package.json — apenas adição cirúrgica".
Decisão registrada em main.md e memory.md.

O que adicionar manualmente ao portal/package.json:
- scripts: db:generate, db:migrate, db:studio, db:push
- dependencies: drizzle-orm ^0.43.1, pg ^8.13.3
- devDependencies: drizzle-kit ^0.31.1, @types/pg ^8.11.11, dotenv ^16.5.0