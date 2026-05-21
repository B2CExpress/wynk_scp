# SPEC-20260518-1915-postgres-drizzle-setup

**Status:** active
**Criada em:** 2026-05-18 19:15
**Branch:** feature/postgres-drizzle-setup
**Concluída:** —
**Commit final:** —

## Objetivo

Configurar Drizzle ORM como camada de acesso a dados do `portal/` (Next.js App Router). Inclui estrutura de migrations versionadas no Git, cliente singleton com padrão `globalThis` (compatível com HMR do Next.js), e validação via Drizzle Studio. O Postgres já está provisionado pelo `docker-compose.yml` da raiz (serviço `db`, porta 5435).

## Contexto / Motivação

Atividade 1.2 do currículo do projeto. ORM evita SQL repetitivo e garante type-safety. Migrations versionadas garantem que todos os devs tenham o mesmo schema. O `backend/` usa TypeORM — o Drizzle é exclusivo do `portal/`.

## Features

- `infrastructure` _(nova — nasce com esta SPEC)_

## Escopo

### IN
- `portal/drizzle.config.ts` — config do Drizzle Kit apontando para `./src/lib/db/schema.ts` e `./src/lib/db/migrations/`
- `portal/.env.example` — `DATABASE_URL=postgres://scp:scp@localhost:5435/scp` (commitado)
- `portal/.env` — variáveis reais, no `.gitignore` do portal (NÃO commitar)
- `portal/src/lib/db/schema.ts` — tabela `_test` temporária para validar fluxo
- `portal/src/lib/db/index.ts` — Pool singleton com padrão `globalThis` + cliente Drizzle exportado como `db`
- `portal/package.json` — **edição cirúrgica**: adicionar apenas deps e scripts em falta, sem substituir o arquivo
  - `scripts`: `db:generate`, `db:migrate`, `db:studio`, `db:push`
  - `dependencies`: `drizzle-orm`, `pg`
  - `devDependencies`: `drizzle-kit`, `@types/pg`, `dotenv`
- Migration inicial gerada (`db:generate`) e aplicada (`db:migrate`) com sucesso
- Drizzle Studio exibindo tabela `_test` em `http://localhost:4983`
- Remoção da tabela `_test` após validação (schema.ts limpo)

### OUT
- `docker-compose.yml` — já existe na raiz, não mexer
- Substituição completa do `portal/package.json` — apenas adição cirúrgica
- Tabelas de domínio reais (tenants, stores, etc.) — SPECs posteriores
- TypeORM do `backend/` — escopo separado, não relacionado
- Redis, Auth — escopos separados
- Deploy / staging / produção

## Fases

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

## Critério de aceite

- [ ] `docker compose up -d` (raiz) sobe Postgres na porta 5435 sem erro
- [ ] `docker compose ps` mostra serviço `db` com status `running`
- [ ] `npm run db:generate` (em portal/) gera arquivo `.sql` em `portal/src/lib/db/migrations/`
- [ ] `npm run db:migrate` aplica migration sem erro
- [ ] `npm run db:studio` abre `http://localhost:4983` exibindo tabela `_test`
- [ ] `portal/.env` está no `.gitignore` do portal e NÃO aparece em `git status`
- [ ] `portal/.env.example` está commitado
- [ ] `portal/src/lib/db/schema.ts` está limpo (sem `_test`) após validação
- [ ] Feature `infrastructure` atualizada com timestamp e referência a esta SPEC (R.7)

## Decisões arquiteturais

| Decisão | Motivo | Data |
|---------|--------|------|
| Drizzle em `portal/src/lib/db/` | Segue convenção já existente (`lib/tenant/`, `lib/theme/`) dentro do portal | 2026-05-18 19:45 |
| `drizzle.config.ts` na raiz do `portal/` | Drizzle Kit precisa do config na raiz do workspace onde os scripts rodam | 2026-05-18 19:45 |
| Padrão `globalThis` no `index.ts` | Next.js App Router recria módulos no HMR — sem isso múltiplos pools abrem em dev | 2026-05-18 19:45 |
| Driver `node-postgres (pg)` | Compatibilidade com `drizzle-orm/node-postgres`, familiaridade da equipe | 2026-05-18 19:45 |
| `DATABASE_URL` com porta 5435 | Porta definida no `docker-compose.yml` da raiz (`${DB_PORT_HOST:-5435}:5432`) | 2026-05-18 19:45 |
| Drizzle exclusivo do `portal/` | `backend/` usa TypeORM — não misturar stacks | 2026-05-18 19:45 |
| Edição cirúrgica do `package.json` | Substituição completa arriscaria sobrescrever configurações existentes | 2026-05-18 20:00 |