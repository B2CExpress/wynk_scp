# Feature: infra-base

**Keywords:** bootstrap, repositorio, ci, lint, format, stack, monorepo, npm-workspaces, docker
**Arquivos principais:**
  - `package.json` (raiz, workspaces: backend/portal/backoffice)
  - `docker-compose.yml` (Postgres 15 + Redis 7, portas 5435/6379)
  - `.github/workflows/ci.yml` (matrix app x task + format:check + validate-flavors)
  - `.prettierrc.json`, `.prettierignore`, `.editorconfig`
  - `backend/package.json`, `backend/tsconfig.json`, `backend/jest.config.js`, `backend/eslint.config.js`
  - `backend/src/{server,app}.ts` (Express bootstrap + composition root)
  - `backend/src/config/{index,database,redis}.ts` (env tipada, AppDataSource, `REDIS_URL`, `CACHE_TTL_TENANT_SECONDS`, ioredis)
  - `backend/scripts/{ensure-schema,seed}.ts` (schema bootstrap + seed reproduzivel)
  - `portal/` (Next.js App Router scaffold, src-dir, eslint, --no-tailwind)
  - `backoffice/` (Vite + React TS scaffold)
**Resumo:** Esqueleto do monorepo (npm workspaces, Node 22+), stack alinhada com `wynk_ecommerce` (Express 4 + TypeORM 0.3 no backend; Next.js App Router no portal; Vite+React no backoffice), pipeline de CI com matriz `[backend, portal, backoffice] x [lint, typecheck, test]` + jobs auxiliares (`format:check`, `validate-flavors`), Postgres+Redis locais via Docker, schema dedicado `scp`. Redis no backend agora e configurado prioritariamente por `REDIS_URL`, com TTLs operacionais sensiveis expostos por env.

## Specs desta feature

### Concluidas
| ID | Data | Commit | Titulo |
|---|---|---|---|
| SPEC-20260503-1505 | 2026-05-11 | `968d389` | Base da plataforma multitenant |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execucao (so em branches - nao aparece em main)
| ID | Titulo | Branch |
|---|---|---|
| SPEC-20260512-1601 | Hardening do cache Redis de tenant | feature/SQU-35-redis-cache |

## Estado atual

Monorepo `wynk-scp` com 3 workspaces (`backend/`, `portal/`, `backoffice/`) gerenciado por **npm workspaces** (Node 22+). Sem Turborepo. Lint via ESLint flat config + `eslint-config-prettier`, format via Prettier (com `docs/`, `*.ico`, `*.lock`, `next-env.d.ts` no `.prettierignore`). CI no GitHub Actions roda 4 jobs em paralelo: a matriz `app x task` (9 combinacoes) + `format:check` + `validate-flavors` (mapeamento `seeds/tenants.json` -> `portal/public/flavors/<slug>/`).

Backend e Express 4 + TypeORM 0.3 com pasta espelhando `wynk_ecommerce/backend/src/` (controllers/services/repositories/routes/entities/migrations/subscribers/middleware/dtos/config/utils). Schema dedicado `scp`. Postgres 15 + Redis 7 via `docker-compose.yml` na raiz (portas 5435/6379 expostas no host por default). Bootstrap orquestrado: `scripts/ensure-schema.ts` (cria `scp` schema via cliente `pg` cru antes de TypeORM tocar) -> `migration:run` -> `seed.ts`.

Configuracao de Redis no backend:
- `REDIS_URL` e a fonte principal de conexao
- `REDIS_HOST`/`REDIS_PORT` continuam aceitos como fallback de compatibilidade
- `CACHE_TTL_TENANT_SECONDS` controla o TTL do cache de resolucao de tenant sem exigir deploy de codigo
- `backend/src/config/redis.ts` usa singleton de `ioredis` e registra falhas de conexao no logger estruturado

> Ultima atualizacao: 2026-05-12 16:01 (SPEC-20260512-1601)

## Decisoes arquiteturais ativas

- **npm workspaces (nao pnpm)** (origem: SPEC-20260503-1505, 2026-05-08 15:33) - Zero dependencia extra no host; pnpm exigiria corepack + alteracao de PATH. Trade-off: sem strict peer deps + `node_modules` duplicado entre apps. Migracao futura e trivial se CI ficar lenta com mais apps.
- **Express 4 + TypeORM 0.3 cru (nao NestJS)** (origem: SPEC-20260503-1505, 2026-05-08 16:43) - Alinha com `wynk_ecommerce` (4 services backend usam Express+TypeORM). Time ja domina, PR mais facil de revisar, sem build step de DI metadata. Trade-off: tenant context vira middleware + AsyncLocalStorage (nao interceptor Nest), DI e factory manual em `server.ts` (composition root). Substitui decisao anterior de 2026-05-08 14:31 que tinha escolhido NestJS antes de inspecionar o padrao da casa.
- **Naming Postgres alinhado com wynk_ecommerce** (origem: SPEC-20260503-1505, 2026-05-08 16:43) - Tabelas `tb_<entity>`, colunas snake_case com prefixo da entity (`tenant_slug`, `user_email`), property TS em camelCase via `name:` no decorator. PK `uuid`. Migrations SQL puro com schema dinamico (`${schemaName}.tb_X`), `CREATE TABLE IF NOT EXISTS`, constraints nomeadas (`pk_tb_X`, `uq_tb_X_<col>`, `fk_tb_X_<col>`).
- **`synchronize: false` + migrations versionadas** (origem: SPEC-20260503-1505, 2026-05-08 17:42) - Schema sempre via migrations; nenhum auto-sync. Entities listadas explicitamente em `AppDataSource.entities[]` (sem glob); migrations e subscribers via glob (`src/` em dev, `dist/` em prod).
- **Redis configurado por URL + TTL operacional via env** (origem: SPEC-20260512-1601, 2026-05-12 16:01) - `REDIS_URL` simplifica configuracao local e remota; `CACHE_TTL_TENANT_SECONDS` evita microajustes de performance via deploy de codigo. Trade-off: precisa coordenar porta default do Docker local com eventuais Redis ja instalados no host.

## Alternativas consideradas e rejeitadas

- **NestJS no backend** (2026-05-08 14:31, revertida em 16:43) - Inicialmente escolhida pelo encaixe natural de interceptors/guards/DI no fluxo multitenant. Rejeitada apos descobrir que `wynk_ecommerce` usa Express+TypeORM cru em 4 services. Reuso do padrao da casa venceu.
- **Fastify** (2026-05-08 14:31) - Performance alta, sintaxe enxuta, mas exigiria wirar DI/validacao manualmente e diverge do padrao Wynk. Descartada.
- **pnpm workspaces** (2026-05-08 15:33) - Estritamente melhor que npm em isolamento de deps + cache global. Rejeitada por exigir `corepack` + alteracao de PATH no host do dev (`/usr/bin` nao-writable sem `sudo`).
- **Turborepo** (2026-05-08 14:31) - Nao antecipado. Entra so se CI ficar lenta com mais apps. Por ora npm workspaces basta para 3 apps.

## Gotchas

- **`@types/express 5.x` invadindo via transitive de `@types/cookie-parser`** (2026-05-08 17:04) - `npm ls @types/express` revela conflito. Fix: `overrides` no `package.json` raiz forcando `@types/express ^4.17.21` + `@types/express-serve-static-core ^4.19.0`. Apagar `node_modules` + `package-lock.json` e necessario para o override pegar.
- **`safer-buffer` ausente apos overrides** (2026-05-08 17:04) - npm dedup agressiva tira `safer-buffer` (transitive `iconv-lite` <- `body-parser` <- `express`). Jest nao sobe arvore para encontrar. Fix: adicionar `safer-buffer ^2.1.2` como dep direta do backend.
- **Jest + npm workspaces hoisting** (2026-05-08 17:04) - Jest nao usa Node module resolution completo (nao sobe arvore). Fix: `moduleDirectories: ['node_modules', '<rootDir>/../node_modules']` no `jest.config.js`.
- **TypeORM CLI tenta criar `migrations` table no schema antes de qualquer migration rodar** (2026-05-08 17:42) - Trava se schema `scp` nao existe. Fix: `scripts/ensure-schema.ts` (cliente `pg` cru, sem TypeORM) executa `CREATE SCHEMA IF NOT EXISTS` no `npm run prepare:schema`, encadeado em `db:setup`.
- **ts-node precisa estar na raiz (nao so no backend)** (2026-05-08 17:42) - Binario `typeorm-ts-node-commonjs` esta em `node_modules/typeorm/` (hoisted para a raiz) e busca `ts-node` a partir dali, sem subir/descer para workspaces. Solucao: `ts-node` e devDep da raiz.
- **`baseUrl` deprecated em TS recente; paths exigem prefixo `./`** (2026-05-08 17:04) - Sem `baseUrl`, paths nao-relativos no `tsconfig` falham. Fix: usar `./` prefixo em tudo.
- **Host sem Docker impede smoke operacional mesmo com docs e testes em dia** (2026-05-12 16:01, SPEC-20260512-1601) - Nesta sessao o binario `docker` nao estava disponivel no PATH. Validacao de containers fica pendente para outro host ou CI.

## Estado congelado (se houver)

_(nenhum)_
