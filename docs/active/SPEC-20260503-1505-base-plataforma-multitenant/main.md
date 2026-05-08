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
**Resumo:** Estabelece o esqueleto da plataforma — repositório, banco com isolamento por `tenant_id`, autenticação JWT, middleware de resolução de tenant a partir do host, e layout raiz que injeta design tokens do tenant ativo.

## Objetivo

Entregar a base mínima sobre a qual todos os módulos posteriores se apoiam: resolução de tenant, isolamento de dados e tema dinâmico funcionando ponta-a-ponta para 1 tenant de teste.

## Escopo

**DENTRO:**
- Setup de repositório, lint, format, CI
- Modelo de dados com `tenant_id` em todas as tabelas multitenant + middleware que rejeita queries sem `tenant_id`
- Tabela `tenants` com config (cores, fontes, favicon, meta, redes sociais)
- Resolução de tenant pelo `host` HTTP (no backend; portal Next.js consome via `headers()` server-side)
- Cache Redis da config do tenant (TTL 10 min, invalidado ao salvar)
- Layout raiz do portal que aplica CSS variables a partir da config do tenant
- Auth JWT (15 min) + refresh token (7 dias) em cookies HttpOnly + Secure + SameSite=Lax
- Seed de 1 tenant para validar o fluxo completo

**FORA:**
- Painel admin (Fase 5)
- Módulos de conteúdo (Fases 2-4)
- CDN, ISR, monitoramento (Fase 6)
- Suporte a `staging.{dominio}` (Fase 6)

## Implementação

**Arquitetura:** monorepo com 3 apps + pnpm workspaces.

- **`backend/`** — NestJS + Postgres + Redis + JWT.
  - Schema: `tenants(id, slug, host, primary_color, secondary_color, font_primary, favicon_url, meta_title, ...)` com campos extensíveis em JSONB. Toda tabela multitenant carrega `tenant_id`.
  - Tenant context propagado via interceptor + `AsyncLocalStorage`. Repositório tenant-aware injetado por DI; helper `withTenant` (camada de query) injeta `WHERE tenant_id = $1` automaticamente — queries cruas sem ele são proibidas (assert em dev, erro em prod).
  - Endpoint `GET /tenant/config` resolve tenant pelo `host` da request, com cache Redis em `tenant:config:{host}` (TTL 10 min, invalidado ao salvar).
  - Auth JWT (15 min) + refresh (7 dias) emitidos como cookies `HttpOnly` + `Secure` + `SameSite=Lax`.
  - Guard global rejeita cross-tenant (tenant resolvido pelo host ≠ tenant dos dados acessados).

- **`portal/`** — Next.js (App Router) + TypeScript.
  - `app/layout.tsx` lê `host` via `headers()` server-side, chama backend `GET /tenant/config`, aplica CSS variables (cores, fontes) no `<body>` e injeta `<link rel="icon">` + `<title>` + `<meta>` do tenant.
  - SSR garante SEO correto por tenant.

- **`backoffice/`** — Vite + React + TypeScript.
  - SPA logada — fora do escopo desta SPEC além do shell mínimo (login JWT que reusa o backend).

- **Tooling:** pnpm workspaces na raiz; cada app com seu `package.json`. CI roda lint + typecheck + testes em todos.

## Critério de aceite

- [ ] Acessar `tenant1.local` carrega config do tenant 1 (cores, fontes, favicon corretos)
- [ ] Cache Redis funciona — segunda requisição não toca o banco
- [ ] Invalidação de cache ao alterar config no banco funciona (teste manual via SQL)
- [ ] Login JWT + refresh token funcionando, cookies marcados HttpOnly + Secure
- [ ] Tentativa de query sem `tenant_id` falha em dev (assert) e em prod (erro de middleware)
- [ ] Trocar host → trocar tenant sem reload manual de cache
- [ ] **Features tocadas (infra-base, tenant-resolution, auth, theme-system) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
