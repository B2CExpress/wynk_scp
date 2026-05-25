# Feature: infra-base
**Keywords:** bootstrap, repositório, ci, lint, format, stack, monorepo, npm-workspaces, docker, onboarding, setup-local, readme
**Arquivos principais:**
  - `package.json` (raiz, workspaces: backend/portal/backoffice)
  - `docker-compose.yml` (Postgres 15 + Redis 7, portas 5435/6379)
  - `.github/workflows/ci.yml` (matrix app x task + format:check + validate-flavors)
  - `.prettierrc.json`, `.prettierignore`, `.editorconfig`
  - `README.md` (raiz — porta de entrada de onboarding; setup local Linux/WSL2 + troubleshooting de gotchas conhecidos)
  - `setup.sh`, `setup.bat` (raiz — atalho idempotente de bootstrap; `setup.bat` é wrapper Windows que dispara `setup.sh` no WSL via `wslpath`)
  - `run.sh`, `run.bat` (raiz — atalho pra subir dev servers; aceita `backend|portal|backoffice|all` + flag `--seed` opt-in)
  - `seeds/tenants.json` (raiz — fonte canônica `tb_tenant` ↔ flavor folder; inclui `localhost` (slug `local-dev`) pra DX sem `/etc/hosts`)
  - `backend/package.json`, `backend/tsconfig.json`, `backend/jest.config.js`, `backend/eslint.config.js`
  - `backend/src/{server,app}.ts` (Express bootstrap + composition root)
  - `backend/src/config/{index,database,redis}.ts` (env tipada, AppDataSource, `REDIS_URL`, `CACHE_TTL_TENANT_SECONDS`, ioredis)
  - `backend/scripts/{ensure-schema,seed}.ts` (schema bootstrap + seed reproduzivel)
  - `portal/` (Next.js App Router scaffold, src-dir, eslint, --no-tailwind)
  - `backoffice/` (Vite + React TS scaffold)

**Resumo:** Esqueleto do monorepo (npm workspaces, Node 22+), stack alinhada com `wynk_ecommerce` (Express 4 + TypeORM 0.3 no backend; Next.js App Router no portal; Vite+React no backoffice), pipeline de CI com matriz `[backend, portal, backoffice] × [lint, typecheck, test]` + jobs auxiliares (`format:check`, `validate-flavors`), Postgres+Redis locais via Docker, schema dedicado `scp`. Onboarding documentado em `README.md` raiz + scripts de atalho (`setup.sh`/`setup.bat` configuram; `run.sh`/`run.bat` rodam dev servers).

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260503-1505 | 2026-05-11 | `968d389` | Base da plataforma multitenant |
| SPEC-20260513-0910 | 2026-05-13 | `1d9ea39` | README de setup local (Linux + Windows via WSL2) + scripts `setup.sh`/`run.sh` |
| SPEC-20260512-1601 | 2026-05-12 | `99a29d1` | Hardening do cache Redis de tenant |
| SPEC-20260512-1900 | 2026-05-13 | `43424f3` | Validação ponta-a-ponta da Fase 1 Multitenant |
| SPEC-20260514-2012 | 2026-05-18 | `b38052c` | Isolamento multitenant de stores com testes reais |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

Monorepo `wynk-scp` com 3 workspaces (`backend/`, `portal/`, `backoffice/`) gerenciado por **npm workspaces** (Node 22+). Sem Turborepo. Lint via ESLint flat config + `eslint-config-prettier`, format via Prettier (com `docs/`, `*.ico`, `*.lock`, `next-env.d.ts` no `.prettierignore`). CI no GitHub Actions roda 4 jobs em paralelo: a matriz `app x task` (9 combinacoes) + `format:check` + `validate-flavors` (mapeamento `seeds/tenants.json` -> `portal/public/flavors/<slug>/`).

Backend e Express 4 + TypeORM 0.3 com pasta espelhando `wynk_ecommerce/backend/src/` (controllers/services/repositories/routes/entities/migrations/subscribers/middleware/dtos/config/utils). Schema dedicado `scp`. Postgres 15 + Redis 7 via `docker-compose.yml` na raiz (portas 5435/6379 expostas no host por default). Bootstrap orquestrado: `scripts/ensure-schema.ts` (cria `scp` schema via cliente `pg` cru antes de TypeORM tocar) -> `migration:run` -> `seed.ts`.

Configuracao de Redis no backend:
- `REDIS_URL` e a fonte principal de conexao
- `REDIS_HOST`/`REDIS_PORT` continuam aceitos como fallback de compatibilidade
- `CACHE_TTL_TENANT_SECONDS` controla o TTL do cache de resolucao de tenant sem exigir deploy de codigo
- `backend/src/config/redis.ts` usa singleton de `ioredis` e registra falhas de conexao no logger estruturado
=======
### Onboarding e atalhos de dev (SPEC-20260513-0910)

Onboarding tem porta de entrada única no `README.md` raiz: passo-a-passo de pré-requisitos (Node 22+, npm 10+, Git, Docker engine + Compose v2 OU v1, WSL2 no Windows), setup Linux/WSL2, comandos do dia-a-dia, estrutura do monorepo e troubleshooting com 10 gotchas conhecidos (formato *Sintoma → Causa → Fix*).

Quatro scripts de atalho na raiz, idempotentes, sem instalar pré-requisitos (apenas verificam):
- **`setup.sh`**: bash que executa `npm install` → copia `.env.example` → `.env` (se faltar) → `docker compose up -d` (detecta v2 plugin OU v1 legacy via cascata) → espera healthy via `docker inspect` → `npm run db:setup -w backend` → opcional `--seed`. Mensagem final aponta `./run.sh`.
- **`setup.bat`**: wrapper Windows que verifica WSL2 + Docker Desktop e dispara `setup.sh` dentro do WSL via `wslpath`. Avisa se `cwd` está em `C:\` (gotcha de I/O).
- **`run.sh`**: parser de args em loop (ordem livre); aceita `backend` (default), `portal`, `backoffice`, `all` (3 em paralelo com `sed -u` prefixando logs e `trap SIGINT/SIGTERM` matando todos os PIDs filhos). Flag `--seed` opt-in roda `npm run seed -w backend` ANTES de subir, mas só pra targets `backend`/`all` (rejeita pra `portal`/`backoffice`).
- **`run.bat`**: wrapper Windows análogo a `setup.bat`, dispara `run.sh` no WSL.

Tenants no `seeds/tenants.json`: `shopping-x` (host `shopping-x.local`, exige `/etc/hosts`) + `local-dev` (host `localhost`, DX local sem mexer em hosts).

## Decisões arquiteturais ativas

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

- **`@types/express 5.x` invadindo via transitive de `@types/cookie-parser`** (2026-05-08 17:04) — `npm ls @types/express` revela conflito. Fix: `overrides` no `package.json` raiz forçando `@types/express ^4.17.21` + `@types/express-serve-static-core ^4.19.0`. Apagar `node_modules` + `package-lock.json` é necessário pro override pegar.
- **`safer-buffer` ausente após overrides** (2026-05-08 17:04) — npm dedup agressiva tira `safer-buffer` (transitive `iconv-lite` ← `body-parser` ← `express`). Jest não sobe árvore pra encontrar. Fix: adicionar `safer-buffer ^2.1.2` como dep direta do backend.
- **Jest + npm workspaces hoisting** (2026-05-08 17:04) — Jest não usa Node module resolution completo (não sobe árvore). Fix: `moduleDirectories: ['node_modules', '<rootDir>/../node_modules']` no `jest.config.js`.
- **TypeORM CLI tenta criar `migrations` table no schema antes de qualquer migration rodar** (2026-05-08 17:42) — Trava se schema `scp` não existe. Fix: `scripts/ensure-schema.ts` (cliente `pg` cru, sem TypeORM) executa `CREATE SCHEMA IF NOT EXISTS` no `npm run prepare:schema`, encadeado em `db:setup`.
- **ts-node precisa estar na raiz (não só no backend)** (2026-05-08 17:42) — Binário `typeorm-ts-node-commonjs` está em `node_modules/typeorm/` (hoisted pra raiz) e busca `ts-node` a partir dali, sem subir/descer pra workspaces. Solução: `ts-node` é devDep da raiz.
- **`baseUrl` deprecated em TS recente; paths exigem prefixo `./`** (2026-05-08 17:04) — Sem `baseUrl`, paths não-relativos no `tsconfig` falham. Fix: usar `./` prefixo em tudo.
- **`docker.io` do Ubuntu universe não vem com plugin Compose v2** (2026-05-13 10:00, [[SPEC-20260513-0910]]) — Pacote `docker.io` do `jammy-updates`/`jammy-security` instala Docker Engine sem `docker compose` (v2). Em Jammy, `apt install docker-compose-plugin` falha com "Unable to locate package" (plugin só está em `download.docker.com`). Fix recomendado: baixar binário direto pra `~/.docker/cli-plugins/docker-compose`; fix fallback: `apt install docker-compose` v1 (EOL jul/2023, mas funcional). `setup.sh` detecta v1/v2 e usa o que tiver via variável `${COMPOSE}` (com warn quando cai no v1).
- **Editar `seeds/tenants.json` não dispara seed automaticamente** (2026-05-13 19:00, [[SPEC-20260513-0910]]) — `./run.sh` é opt-in: rodar seed depois requer `npm run seed -w backend` direto OU `./run.sh --seed backend` (que faz seed antes de subir). Caso típico: dev edita JSON, sobe `./run.sh backend`, backend continua respondendo 404 pro tenant novo (porque o banco não foi atualizado). Documentado em README troubleshooting #9.

## Estado congelado (se houver)

_(nenhum)_
