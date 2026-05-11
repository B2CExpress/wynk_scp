# SPEC-20260503-1505: Base da plataforma multitenant

**Status:** done
**Criada:** 2026-05-03 15:05
**Ativada:** 2026-05-08 14:22
**Concluída:** 2026-05-11 09:00
**Commit final:** `968d389` (último commit antes do arquivamento; ver branch `feature/multitenant-platform` pra histórico completo)
**Keywords:** multitenant, bootstrap, auth, tenant-resolution, theme-system
**Features:** infra-base, tenant-resolution, auth, theme-system
**Branch:** feature/multitenant-platform
**Depende de:** —
**Origem:** derivada da guia inicial `docs/specs/scp-spec.md` (descartável após gerar esta leva de SPECs) — usuário em 2026-05-03 15:05
**Resumo:** Estabelece o esqueleto da plataforma — repositório, banco com isolamento por `tenant_id`, autenticação JWT, middleware de resolução de tenant a partir do host, e layout raiz que aplica a identidade visual do tenant a partir de **flavor versionado em repo** (`portal/public/flavors/<slug>/`).

## Objetivo

Entregar a base mínima sobre a qual todos os módulos posteriores se apoiam: resolução de tenant, isolamento de dados e tema dinâmico funcionando ponta-a-ponta para 1 tenant de teste.

## Escopo

**DENTRO:**
- Setup de repositório, lint, format, CI
- Modelo de dados com `tenant_id` em todas as tabelas multitenant + helper que rejeita queries sem `tenant_id`
- Tabela `tenants(id, slug, host, flavor_slug, ...)` — **identidade operacional** apenas, sem branding visual
- Pasta **`portal/public/flavors/<slug>/`** versionada em repo, contendo:
  - `theme.json` — cores, fontes, meta (title/description), redes sociais, contato
  - `logo.svg`, `favicon.ico` (obrigatórios)
  - `og-image.jpg` e demais assets (opcionais, com fallback em `_default/`)
- Pasta `portal/public/flavors/_default/` como fallback de assets faltantes
- Resolução de tenant pelo `host` HTTP (no backend; portal Next.js consome via `headers()` server-side)
- Cache Redis do mapeamento `host → tenant {id, slug, flavor_slug}` (TTL 10 min, invalidado em alteração de host/flavor_slug)
- Layout raiz do portal que carrega `theme.json` do flavor + aplica CSS variables + injeta favicon/meta
- Validação no CI: para cada `flavor_slug` na tabela `tenants`, existe pasta `portal/public/flavors/<slug>/` com pelo menos `theme.json`, `logo.svg` e `favicon.ico`
- Auth JWT (15 min) + refresh token (7 dias) em cookies HttpOnly + Secure + SameSite=Lax
- Seed de 1 tenant + 1 flavor de exemplo para validar o fluxo completo

**FORA:**
- Edição de identidade visual em runtime — toda mudança de cor/fonte/logo passa por PR + deploy (não há painel pra branding, nunca haverá)
- Painel admin de **conteúdo** (lojas, eventos, etc. — Fase 5)
- Módulos de conteúdo (Fases 2-4)
- CDN externa, ISR, monitoramento (Fase 6) — assets de flavor são servidos pelo próprio Next em `/flavors/<slug>/...`
- Suporte a `staging.{dominio}` (Fase 6)

## Implementação

**Arquitetura:** monorepo com 3 apps + npm workspaces. Identidade visual é **build-time** (Modelo A — flavor folder); dados operacionais são runtime.

- **`backend/`** — Express 4 + TypeORM 0.3 + Postgres + Redis (ioredis) + JWT (jsonwebtoken). Stack alinhada com `wynk_ecommerce/backend/` para reuso de patterns e familiaridade do time.
  - Estrutura de pastas: `controllers/`, `services/`, `repositories/`, `routes/`, `entities/`, `migrations/`, `subscribers/`, `middleware/`, `dtos/`, `config/`, `utils/` (espelha `wynk_ecommerce/backend/src/`).
  - Schema em **schema dedicado** `scp` (configurável via env). Tabela `tb_tenant(tenant_id uuid pk, tenant_slug, tenant_host, tenant_flavor_slug, tenant_name, tenant_created_at, tenant_updated_at)` — **somente identidade operacional**. Toda tabela multitenant carrega `tenant_id`.
  - Convenções de naming alinhadas com wynk_ecommerce: tabelas com prefixo `tb_`, colunas com prefixo do nome da entity (`tenant_slug`, `tenant_host`, etc.), property TS em camelCase com mapeamento via `name:` no decorator.
  - Tenant context propagado via **middleware Express** + `AsyncLocalStorage` (Node nativo, sem framework de DI). Helper `withTenant(qb, ctx)` aplica `WHERE tenant_id = $1` em `QueryBuilder`/`Repository`. Subscriber TypeORM (`@EventSubscriber`) injeta `tenant_id` em insert/update/delete pegando do `AsyncLocalStorage`. Queries cruas sem `tenant_id` são proibidas (assert em dev, erro em prod).
  - Endpoint `GET /tenant/resolve` recebe `host` da request e retorna `{ id, slug, flavorSlug }`. Cache Redis em `tenant:resolve:{host}` (TTL 10 min, invalidado em mudança de host/flavor_slug — operação rara).
  - Auth JWT (15 min) + refresh (7 dias) com `jsonwebtoken`, emitidos como cookies `HttpOnly` + `Secure` + `SameSite=Lax`. Middleware `requireAuth` valida e popula `req.user`.
  - Middleware `requireSameTenant` rejeita cross-tenant (tenant resolvido pelo host ≠ tenant dos dados acessados).
  - Migrations: SQL puro via `queryRunner.query()`, com schema dinâmico (`${schemaName}.tb_X`), `CREATE TABLE IF NOT EXISTS`, constraints nomeadas (`pk_tb_X`, `uq_tb_X_<col>`, `fk_tb_X_<col>`).

- **`portal/`** — Next.js (App Router) + TypeScript.
  - **Flavors versionados em `portal/public/flavors/<slug>/`** — uma pasta por tenant:
    ```
    portal/flavors/
      _default/                    # fallback de assets ausentes
        theme.json
        logo.svg
        favicon.ico
      shopping-x/
        theme.json                 # cores, fontes, meta, social, contato
        logo.svg                   # obrigatório
        favicon.ico                # obrigatório
        og-image.jpg               # opcional
    ```
  - `app/layout.tsx` lê `host` via `headers()` server-side, chama `/tenant/resolve` no backend → recebe `flavorSlug`, importa estaticamente `portal/flavors/<flavorSlug>/theme.json`, aplica CSS variables na `<html>`, injeta `<title>`, `<meta>`, `<link rel="icon" href="/flavors/<slug>/favicon.ico">`.
  - Tipagem: `theme.json` validado em build via schema TS (`type Theme = {...}`); CI falha se algum flavor estiver fora do schema.
  - Pasta `portal/public/flavors/<slug>/` é servida estaticamente pelo Next via `public/flavors/<slug>/...` (symlink ou cópia em build) — assets disponíveis em `https://<host>/flavors/<slug>/logo.svg`.
  - SSR garante SEO correto por tenant e zero FOUC.

- **`backoffice/`** — Vite + React + TypeScript.
  - SPA logada — fora do escopo desta SPEC além do shell mínimo (login JWT que reusa o backend).

- **Tooling:** npm workspaces na raiz; cada app com seu `package.json`. CI roda lint + typecheck + testes em todos + valida correspondência entre tabela `tb_tenant` e pastas em `portal/flavors/`. Postgres 16 + Redis 7 locais via `docker-compose.yml` na raiz.

## Critério de aceite

- [x] Acessar `tenant1.local` carrega o flavor correto: cores e fontes do `theme.json` aplicadas via CSS vars; `logo.svg` e `favicon.ico` servidos de `/flavors/<slug>/`; `<title>` e `<meta>` corretos (2026-05-09 09:55, fase 4)
- [x] Cache Redis do mapeamento host→tenant funciona — segunda requisição da mesma URL não toca o banco (2026-05-08 19:03, fase 3)
- [x] Invalidação de cache ao alterar `host` ou `flavor_slug` no banco funciona (teste manual via SQL) (2026-05-11 08:50, fase 6)
- [x] Login JWT + refresh token funcionando, cookies marcados HttpOnly + Secure + SameSite=Lax (2026-05-09 19:45, fase 5)
- [x] Tentativa de query sem `tenant_id` falha em dev (assert) e em prod (erro do helper) (2026-05-11 08:50, fase 6, 13 testes de cross-tenant-isolation)
- [x] Trocar host → trocar tenant sem reload manual de cache (2026-05-08 19:03, fase 3 + fase 6)
- [x] CI valida que cada `tenant_flavor_slug` na tabela `tb_tenant` tem pasta `portal/public/flavors/<slug>/` com `theme.json`, `logo.svg`, `favicon.ico` (e `theme.json` válido contra o schema TS) (2026-05-09 09:55, fase 4, `validate-flavors`)
- [x] `theme.json` do flavor `_default` existe e cobre todos os campos obrigatórios (2026-05-08 15:53, fase 1 + fase 4)
- [x] **Features tocadas (infra-base, tenant-resolution, auth, theme-system) atualizadas** com timestamp e referência a esta SPEC (2026-05-11 09:00, fase 7)
- [x] `state.md` com entrada `[conclusão]` (2026-05-11 08:50, fase 6 + arquivamento na fase 7)
- [x] `memory.md` com TL;DR final atualizado (2026-05-11 09:00, fase 7)
