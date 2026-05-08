# SPEC-20260503-1505: Base da plataforma multitenant

**Status:** active
**Criada:** 2026-05-03 15:05
**Ativada:** 2026-05-08 14:22
**Concluída:** —
**Commit final:** —
**Keywords:** multitenant, bootstrap, auth, tenant-resolution, theme-system
**Features:** infra-base, tenant-resolution, auth, theme-system
**Branch:** feature/multitenant-platform
**Depende de:** —
**Origem:** derivada da guia inicial `docs/specs/scp-spec.md` (descartável após gerar esta leva de SPECs) — usuário em 2026-05-03 15:05
**Resumo:** Estabelece o esqueleto da plataforma — repositório, banco com isolamento por `tenant_id`, autenticação JWT, middleware de resolução de tenant a partir do host, e layout raiz que aplica a identidade visual do tenant a partir de **flavor versionado em repo** (`portal/flavors/<slug>/`).

## Objetivo

Entregar a base mínima sobre a qual todos os módulos posteriores se apoiam: resolução de tenant, isolamento de dados e tema dinâmico funcionando ponta-a-ponta para 1 tenant de teste.

## Escopo

**DENTRO:**
- Setup de repositório, lint, format, CI
- Modelo de dados com `tenant_id` em todas as tabelas multitenant + helper que rejeita queries sem `tenant_id`
- Tabela `tenants(id, slug, host, flavor_slug, ...)` — **identidade operacional** apenas, sem branding visual
- Pasta **`portal/flavors/<slug>/`** versionada em repo, contendo:
  - `theme.json` — cores, fontes, meta (title/description), redes sociais, contato
  - `logo.svg`, `favicon.ico` (obrigatórios)
  - `og-image.jpg` e demais assets (opcionais, com fallback em `_default/`)
- Pasta `portal/flavors/_default/` como fallback de assets faltantes
- Resolução de tenant pelo `host` HTTP (no backend; portal Next.js consome via `headers()` server-side)
- Cache Redis do mapeamento `host → tenant {id, slug, flavor_slug}` (TTL 10 min, invalidado em alteração de host/flavor_slug)
- Layout raiz do portal que carrega `theme.json` do flavor + aplica CSS variables + injeta favicon/meta
- Validação no CI: para cada `flavor_slug` na tabela `tenants`, existe pasta `portal/flavors/<slug>/` com pelo menos `theme.json`, `logo.svg` e `favicon.ico`
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

- **`backend/`** — NestJS + Postgres + Redis + JWT.
  - Schema: `tenants(id, slug, host, flavor_slug, name, created_at, updated_at)` — **somente identidade operacional**. Toda tabela multitenant carrega `tenant_id`.
  - Tenant context propagado via interceptor + `AsyncLocalStorage`. Repositório tenant-aware injetado por DI; helper `withTenant` (camada de query) injeta `WHERE tenant_id = $1` automaticamente — queries cruas sem ele são proibidas (assert em dev, erro em prod).
  - Endpoint `GET /tenant/resolve` recebe `host` da request e retorna `{ id, slug, flavorSlug }`. Cache Redis em `tenant:resolve:{host}` (TTL 10 min, invalidado em mudança de host/flavor_slug — operação rara).
  - Auth JWT (15 min) + refresh (7 dias) emitidos como cookies `HttpOnly` + `Secure` + `SameSite=Lax`.
  - Guard global rejeita cross-tenant (tenant resolvido pelo host ≠ tenant dos dados acessados).

- **`portal/`** — Next.js (App Router) + TypeScript.
  - **Flavors versionados em `portal/flavors/<slug>/`** — uma pasta por tenant:
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
  - Pasta `portal/flavors/<slug>/` é servida estaticamente pelo Next via `public/flavors/<slug>/...` (symlink ou cópia em build) — assets disponíveis em `https://<host>/flavors/<slug>/logo.svg`.
  - SSR garante SEO correto por tenant e zero FOUC.

- **`backoffice/`** — Vite + React + TypeScript.
  - SPA logada — fora do escopo desta SPEC além do shell mínimo (login JWT que reusa o backend).

- **Tooling:** npm workspaces na raiz; cada app com seu `package.json`. CI roda lint + typecheck + testes em todos + valida correspondência entre tabela `tenants` e pastas em `portal/flavors/`.

## Critério de aceite

- [ ] Acessar `tenant1.local` carrega o flavor correto: cores e fontes do `theme.json` aplicadas via CSS vars; `logo.svg` e `favicon.ico` servidos de `/flavors/<slug>/`; `<title>` e `<meta>` corretos
- [ ] Cache Redis do mapeamento host→tenant funciona — segunda requisição da mesma URL não toca o banco
- [ ] Invalidação de cache ao alterar `host` ou `flavor_slug` no banco funciona (teste manual via SQL)
- [ ] Login JWT + refresh token funcionando, cookies marcados HttpOnly + Secure + SameSite=Lax
- [ ] Tentativa de query sem `tenant_id` falha em dev (assert) e em prod (erro do helper)
- [ ] Trocar host → trocar tenant sem reload manual de cache
- [ ] CI valida que cada `flavor_slug` na tabela `tenants` tem pasta `portal/flavors/<slug>/` com `theme.json`, `logo.svg`, `favicon.ico` (e `theme.json` válido contra o schema TS)
- [ ] `theme.json` do flavor `_default` existe e cobre todos os campos obrigatórios
- [ ] **Features tocadas (infra-base, tenant-resolution, auth, theme-system) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
