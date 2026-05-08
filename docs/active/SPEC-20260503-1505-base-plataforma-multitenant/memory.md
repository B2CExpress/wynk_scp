# Memory — SPEC-20260503-1505

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 17:04 (sessão #1)
**Onde tô:** **Fase 1.5 fechada.** Backend Express+TypeORM rodando: typecheck/lint/test/format passam. Todos os 3 apps verdes. Pronto pra fase 2 propriamente.
**Próximo passo:** Fase 2 — `docker-compose.yml` (Postgres 16 + Redis 7), entity `Tenant`, migration inicial, `UuidHelper`, middleware `tenant-context.ts` (AsyncLocalStorage), helper `withTenant`, subscriber TypeORM. Schema `scp` no Postgres.
**Última decisão:** Bootstrap Express com 6 gotchas resolvidos (override de `@types/express`, `safer-buffer` direto, `moduleDirectories` no Jest, `isolatedModules` no tsconfig, paths com prefixo `./`, NodeNext). Versões: express ^4.22, typeorm ^0.3.27, jsonwebtoken ^9, ioredis ^5.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** state.md TL;DR + entrada `[conclusão] Fase 1.5` (17:04).

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão de **ativação** da SPEC-1505 (base da plataforma multitenant). Repositório está praticamente vazio fora de `docs/`. O objetivo é entregar a fundação ponta-a-ponta para 1 tenant: schema com `tenant_id`, resolução por host, cache Redis, layout raiz com CSS vars do tenant, JWT + refresh, seed.

Sessão de ativação fechou com:
1. Movimentação `future/` → `active/`
2. Atualização do `main.md` (status, ativada, branch, título, **§Implementação reescrita pra 3 apps**)
3. Criação de `state.md` + `memory.md`
4. Criação de 4 stubs de feature em `docs/features/`
5. Stack confirmada: NestJS / Next App Router / Vite+React / pnpm workspaces
6. CLAUDE.md atualizado (placeholders de stack e comandos substituídos)

### Hipóteses em jogo

- ~~**`docs/specs/scp-spec.md` é a fonte autoritativa para parâmetros operacionais**~~ — **descartada 2026-05-08 15:13**: arquivo nunca existiu (pasta `docs/specs/` não existe). Parâmetros operacionais estão inline no `main.md`.

### Decisões recentes que importam pra continuar

- [2026-05-08 16:43] **Stack do backend revisada:** Express 4 + TypeORM 0.3 cru (não NestJS). Razão: alinhar com `wynk_ecommerce/backend/`. Dev confirmou apagar backend/ atual e recriar espelhando estrutura do wynk_ecommerce. Versões alinhadas com `wynk_ecommerce/backend/package.json`.
- [2026-05-08 16:43] **Naming Postgres:** tabelas `tb_<entity>`, colunas com prefixo `<entity>_<col>` snake_case, property TS camelCase via `name:` no decorator. Schema dedicado = `scp`. PK = uuid. Migrations SQL puro com schema dinâmico.
- [2026-05-08 16:43] **Divergência consciente:** wynk_ecommerce tem `tb_white_label_config` (Modelo B — DB). SCP usa Modelo A (flavor folder). Justificada por dev em 15:30.
- [2026-05-08 15:33] **White-label = Modelo A (build-time).** Branding em `portal/flavors/<slug>/{theme.json, logo.svg, favicon.ico}`. Tabela `tb_tenant` (renomeada de `tenants`) perde colunas de branding. Endpoint `/tenant/resolve`. Cache Redis em `tenant:resolve:{host}`. Fallback em `portal/flavors/_default/`. CI valida correspondência tabela ↔ pastas.
- [2026-05-08 15:33] **npm workspaces** (não pnpm).
- [2026-05-08 14:31] **Frontends:** Next.js App Router (portal — SSR pra SEO), Vite+React (backoffice — SPA logada). Sem Turborepo no início.
- [2026-05-08 14:31] **Resolução de tenant fica no backend**, não no Next. Portal SSR chama backend; backend cacheia em Redis.
- [2026-05-08 14:31] **Auth:** cookies HttpOnly + Secure + SameSite=Lax. Lib: `jsonwebtoken` (alinhado com wynk_ecommerce).
- [2026-05-08 14:22] Branch oficial: `feature/multitenant-platform`.

### Respostas-chave do usuário

- [2026-05-08 16:43] Usuário: "Podemos mudar para Express?" → após apresentação de trade-offs → "1 - sim / 2 - reescrever só o que for usar / 3 - ok"
  Contexto: após eu mapear que `wynk_ecommerce` usa Express+TypeORM cru em todos os 4 services backend, dev pediu pra alinhar a stack do SCP. Confirmou (1) manter estrutura inteira do wynk_ecommerce, (2) reescrever utilitários sob demanda, (3) apagar `backend/` atual e recomeçar.
- [2026-05-08 16:38] Usuário: "Olha qual utilizamos no wynk_ecommerce" + "Sim, a ideia é seguir esse padrão"
  Contexto: ao decidir ORM, pediu pra checar o padrão da casa. Confirmou TypeORM + naming verboso (`tb_<entity>`, colunas com prefixo).
- [2026-05-08 15:33] Usuário: "Isso, modelo A"
  Contexto: após 3 modelos de white-label (A build-time, B runtime/DB, C híbrido), escolheu A. Justificativa literal: "se deixamos tudo na base podemos altera em produção sem testar antes, então sendo em aquivos flavors/<slug>/theme.json a unica forma de alterar é publicando uma nova versão em TI e depois promove-la".
- [2026-05-08 15:30] Usuário: "Pode ser, outra coisa que precisamos definir é criar uma especie de white label..."
  Contexto: confirmou troca pnpm → npm workspaces.
- [2026-05-08 14:31] Usuário: "Ok, então sim, manda bala"
  Contexto: confirmou stack dos 3 apps (na época, com NestJS — depois revisada).
- [2026-05-08 14:22] Usuário: "Confirmo plano de ativação / Atualizar o main.md pra refletir feature/multitenant-platform"
  Contexto: optou por alinhar `main.md` à branch já existente.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda — sessão de ativação)_

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260503-1505-base-plataforma-multitenant/main.md` (atualizado)
- `docs/active/SPEC-20260503-1505-base-plataforma-multitenant/state.md` (criado)
- `docs/active/SPEC-20260503-1505-base-plataforma-multitenant/memory.md` (criado — este)
- `docs/features/infra-base.md` (criado — stub)
- `docs/features/tenant-resolution.md` (criado — stub)
- `docs/features/auth.md` (criado — stub)
- `docs/features/theme-system.md` (criado — stub)

### Onde parei exatamente

Fase 1.5 fechada. Bootstrap Express + TypeORM passa em todos os checks. Próxima sessão começa fase 2 propriamente:

1. **`docker-compose.yml` na raiz** — Postgres 16 + Redis 7. Conferir versões/portas com `wynk_ecommerce/docker-compose.yml` antes de criar.
2. **Migration `0001-InitialSchema.ts`** ou similar — cria schema `scp` se não existir + extensão UUID (`pgcrypto` ou `uuid-ossp`).
3. **`backend/src/utils/uuid-helper.ts`** — adaptado de `wynk_ecommerce/backend/src/utils/uuid-helper.ts`. Detecta qual função UUID está disponível.
4. **`backend/src/entities/Tenant.ts`** — entity com decorators TypeORM. Mapping: tabela `tb_tenant`, colunas `tenant_<col>` snake_case + properties TS camelCase.
5. **Migration `<ts>-CreateTenantTable.ts`** — `CREATE TABLE IF NOT EXISTS scp.tb_tenant (...)` com schema dinâmico, constraints nomeadas (`pk_tb_tenant`, `uq_tb_tenant_slug`, `uq_tb_tenant_host`).
6. **Adicionar `Tenant` ao `AppDataSource.entities[]`** em `backend/src/config/database.ts`.
7. **`backend/src/middleware/tenant-context.ts`** — middleware que cria `AsyncLocalStorage<TenantContext>` no início de cada request. (Pode ler tenant_id de header de teste ou cookie pra começar; resolução real por host vem na fase 3.)
8. **`backend/src/utils/with-tenant.ts`** — `withTenant(qb)` aplica `WHERE tenant_id = $1` em QueryBuilder.
9. **`backend/src/subscribers/TenantSubscriber.ts`** — `@EventSubscriber()` que injeta `tenant_id` em `beforeInsert`/`beforeUpdate` pegando do AsyncLocalStorage.
10. Smoke test E2E: subir docker compose, rodar migration, fazer health + insert de tenant via SQL, verificar que helper funciona.

**Conhecimento útil pra retomada:**
- Backend roda em port 3001 por default; Postgres 5432; Redis 6379.
- Schema do banco = `scp` (configurável via `DB_SCHEMA`).
- `npm run dev -w backend` sobe com ts-node-dev watching. Mas sem DB rodando, ele falha em `AppDataSource.initialize()`. Checar `docker compose up -d` antes.
- `npm run migration:create -w backend -- src/migrations/<NomePascalCase>` cria migration vazia.
- `npm run migration:run -w backend` aplica.
- Padrão wynk_ecommerce: SQL puro via `queryRunner.query(...)`. **Nada de migration:generate** (gera com base em diff de entities, pouco previsível).
- Lista explícita de entities em `AppDataSource.entities[]` (importar e adicionar manual).
- `safer-buffer` está como dep direta pra contornar bug de hoisting (gotcha documentado em state.md fase 1.5).
- `@types/express 5.x` é bloqueado por override no package.json raiz (transitive de `@types/cookie-parser`).

Pendência externa pra dev decidir antes da fase 1 começar: mini-SPEC de limpeza pras referências fantasma em SPEC-1506/1507/1508/1509/1510, ou deixa pra ativação de cada uma.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-08 14:22 | em curso | ativação | Move future→active, atualiza main.md, cria state/memory + 4 stubs de feature |
