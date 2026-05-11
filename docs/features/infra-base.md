# Feature: infra-base

**Keywords:** bootstrap, repositório, ci, lint, format, stack, monorepo, npm-workspaces, docker
**Arquivos principais:**
  - `package.json` (raiz, workspaces: backend/portal/backoffice)
  - `docker-compose.yml` (Postgres 15 + Redis 7, portas 5435/6382)
  - `.github/workflows/ci.yml` (matrix app × task + format:check + validate-flavors)
  - `.prettierrc.json`, `.prettierignore`, `.editorconfig`
  - `backend/package.json`, `backend/tsconfig.json`, `backend/jest.config.js`, `backend/eslint.config.js`
  - `backend/src/{server,app}.ts` (Express bootstrap + composition root)
  - `backend/src/config/{index,database,redis}.ts` (env tipada, AppDataSource, ioredis)
  - `backend/scripts/{ensure-schema,seed}.ts` (schema bootstrap + seed reproduzível)
  - `portal/` (Next.js App Router scaffold, src-dir, eslint, --no-tailwind)
  - `backoffice/` (Vite + React TS scaffold)
**Resumo:** Esqueleto do monorepo (npm workspaces, Node 22+), stack alinhada com `wynk_ecommerce` (Express 4 + TypeORM 0.3 no backend; Next.js App Router no portal; Vite+React no backoffice), pipeline de CI com matriz `[backend, portal, backoffice] × [lint, typecheck, test]` + jobs auxiliares (`format:check`, `validate-flavors`), Postgres+Redis locais via Docker, schema dedicado `scp`.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260503-1505 | 2026-05-11 | `968d389` | Base da plataforma multitenant |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

Monorepo `wynk-scp` com 3 workspaces (`backend/`, `portal/`, `backoffice/`) gerenciado por **npm workspaces** (Node 22+). Sem Turborepo. Lint via ESLint flat config + `eslint-config-prettier`, format via Prettier (com `docs/`, `*.ico`, `*.lock`, `next-env.d.ts` no `.prettierignore`). CI no GitHub Actions roda 4 jobs em paralelo: a matriz `app × task` (9 combinações) + `format:check` + `validate-flavors` (mapeamento `seeds/tenants.json` ↔ `portal/public/flavors/<slug>/`).

Backend é Express 4 + TypeORM 0.3 com pasta espelhando `wynk_ecommerce/backend/src/` (controllers/services/repositories/routes/entities/migrations/subscribers/middleware/dtos/config/utils). Schema dedicado `scp`. Postgres 15 + Redis 7 via `docker-compose.yml` na raiz (portas 5435/6382 expostas no host pra evitar conflito com `wynk_ecommerce` 5434/6381). Bootstrap orquestrado: `scripts/ensure-schema.ts` (cria `scp` schema via cliente `pg` cru antes de TypeORM tocar) → `migration:run` → `seed.ts`.

> Última atualização: 2026-05-11 09:00 (SPEC-20260503-1505)

## Decisões arquiteturais ativas

- **npm workspaces (não pnpm)** (origem: SPEC-20260503-1505, 2026-05-08 15:33) — Zero dependência extra no host; pnpm exigiria corepack + alteração de PATH. Trade-off: sem strict peer deps + `node_modules` duplicado entre apps. Migração futura é trivial se CI ficar lenta com mais apps.
- **Express 4 + TypeORM 0.3 cru (não NestJS)** (origem: SPEC-20260503-1505, 2026-05-08 16:43) — Alinha com `wynk_ecommerce` (4 services backend usam Express+TypeORM). Time já domina, PR mais fácil de revisar, sem build step de DI metadata. Trade-off: tenant context vira middleware + AsyncLocalStorage (não interceptor Nest), DI é factory manual em `server.ts` (composition root). Substitui decisão anterior de 2026-05-08 14:31 que tinha escolhido NestJS antes de inspecionar o padrão da casa.
- **Naming Postgres alinhado com wynk_ecommerce** (origem: SPEC-20260503-1505, 2026-05-08 16:43) — Tabelas `tb_<entity>`, colunas snake_case com prefixo da entity (`tenant_slug`, `user_email`), property TS em camelCase via `name:` no decorator. PK `uuid`. Migrations SQL puro com schema dinâmico (`${schemaName}.tb_X`), `CREATE TABLE IF NOT EXISTS`, constraints nomeadas (`pk_tb_X`, `uq_tb_X_<col>`, `fk_tb_X_<col>`).
- **`synchronize: false` + migrations versionadas** (origem: SPEC-20260503-1505, 2026-05-08 17:42) — Schema sempre via migrations; nenhum auto-sync. Entities listadas explicitamente em `AppDataSource.entities[]` (sem glob); migrations e subscribers via glob (`src/` em dev, `dist/` em prod).

## Alternativas consideradas e rejeitadas

- **NestJS no backend** (2026-05-08 14:31, revertida em 16:43) — Inicialmente escolhida pelo encaixe natural de interceptors/guards/DI no fluxo multitenant. Rejeitada após descobrir que `wynk_ecommerce` usa Express+TypeORM cru em 4 services. Reuso do padrão da casa venceu.
- **Fastify** (2026-05-08 14:31) — Performance alta, sintaxe enxuta, mas exigiria wirar DI/validação manualmente e diverge do padrão Wynk. Descartada.
- **pnpm workspaces** (2026-05-08 15:33) — Estritamente melhor que npm em isolamento de deps + cache global. Rejeitada por exigir `corepack` + alteração de PATH no host do dev (`/usr/bin` não-writable sem `sudo`).
- **Turborepo** (2026-05-08 14:31) — Não antecipado. Entra só se CI ficar lenta com mais apps. Por ora npm workspaces basta pra 3 apps.

## Gotchas

- **`@types/express 5.x` invadindo via transitive de `@types/cookie-parser`** (2026-05-08 17:04) — `npm ls @types/express` revela conflito. Fix: `overrides` no `package.json` raiz forçando `@types/express ^4.17.21` + `@types/express-serve-static-core ^4.19.0`. Apagar `node_modules` + `package-lock.json` é necessário pro override pegar.
- **`safer-buffer` ausente após overrides** (2026-05-08 17:04) — npm dedup agressiva tira `safer-buffer` (transitive `iconv-lite` ← `body-parser` ← `express`). Jest não sobe árvore pra encontrar. Fix: adicionar `safer-buffer ^2.1.2` como dep direta do backend.
- **Jest + npm workspaces hoisting** (2026-05-08 17:04) — Jest não usa Node module resolution completo (não sobe árvore). Fix: `moduleDirectories: ['node_modules', '<rootDir>/../node_modules']` no `jest.config.js`.
- **TypeORM CLI tenta criar `migrations` table no schema antes de qualquer migration rodar** (2026-05-08 17:42) — Trava se schema `scp` não existe. Fix: `scripts/ensure-schema.ts` (cliente `pg` cru, sem TypeORM) executa `CREATE SCHEMA IF NOT EXISTS` no `npm run prepare:schema`, encadeado em `db:setup`.
- **ts-node precisa estar na raiz (não só no backend)** (2026-05-08 17:42) — Binário `typeorm-ts-node-commonjs` está em `node_modules/typeorm/` (hoisted pra raiz) e busca `ts-node` a partir dali, sem subir/descer pra workspaces. Solução: `ts-node` é devDep da raiz.
- **`baseUrl` deprecated em TS recente; paths exigem prefixo `./`** (2026-05-08 17:04) — Sem `baseUrl`, paths não-relativos no `tsconfig` falham. Fix: usar `./` prefixo em tudo.

## Estado congelado (se houver)

_(nenhum)_
