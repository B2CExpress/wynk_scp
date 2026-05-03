# SPEC-20260503-1505: Base da plataforma multitenant

**Status:** draft
**Criada:** 2026-05-03 15:05
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** multitenant, bootstrap, auth, tenant-resolution, theme-system
**Features:** infra-base, tenant-resolution, auth, theme-system
**Branch:** feature/base-plataforma-multitenant (quando ativa)
**Depende de:** —
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 1 — usuário em 2026-05-03 15:05
**Resumo:** Estabelece o esqueleto da plataforma — repositório, banco com isolamento por `tenant_id`, autenticação JWT, middleware de resolução de tenant a partir do host, e layout raiz que injeta design tokens do tenant ativo.

## Objetivo

Entregar a base mínima sobre a qual todos os módulos posteriores se apoiam: resolução de tenant, isolamento de dados e tema dinâmico funcionando ponta-a-ponta para 1 tenant de teste.

## Escopo

**DENTRO:**
- Setup de repositório, lint, format, CI
- Modelo de dados com `tenant_id` em todas as tabelas multitenant + middleware que rejeita queries sem `tenant_id`
- Tabela `tenants` com config (cores, fontes, favicon, meta, redes sociais)
- Resolução de tenant pelo `host` HTTP (via `headers()` no Next.js — ver §6.2 da spec-mãe)
- Cache Redis da config do tenant (TTL 10 min, invalidado ao salvar — §9)
- Layout raiz que aplica CSS variables a partir da config do tenant (§8)
- Auth JWT (15 min) + refresh token (7 dias) em cookies HttpOnly (§10)
- Seed de 1 tenant para validar o fluxo completo

**FORA:**
- Painel admin (Fase 5)
- Módulos de conteúdo (Fases 2-4)
- CDN, ISR, monitoramento (Fase 6)
- Suporte a `staging.{dominio}` (Fase 6)

## Implementação

- Stack: Next.js (App Router) + Postgres + Redis + JWT
- `app/layout.tsx` lê `host` via `headers()`, chama `getTenantConfig(host)`, aplica CSS vars no `<body>`
- `lib/tenant.ts` encapsula resolução + cache Redis com chave `tenant:config:{host}`
- Middleware Next.js valida correspondência entre tenant resolvido e dados acessados (rejeita cross-tenant)
- Schema: `tenants(id, slug, host, primary_color, secondary_color, font_primary, favicon_url, meta_title, ...)` em JSONB para campos extensíveis
- Helper de query (`db/withTenant`) que injeta `WHERE tenant_id = $1` automaticamente — proibir queries diretas sem ele

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
