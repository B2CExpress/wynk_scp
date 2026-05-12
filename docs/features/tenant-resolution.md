# Feature: tenant-resolution

**Keywords:** multitenant, tenant_id, host, middleware, cache, redis, isolamento, async-local-storage, subscriber
**Arquivos principais:**
  - `backend/src/entities/Tenant.ts` (tabela `tb_tenant` — identidade operacional, sem branding)
  - `backend/src/repositories/tenant.repository.ts` (`findByHost`, `findBySlug`, `findById`)
  - `backend/src/services/tenant-resolver.service.ts` (resolve + cache Redis + invalidate)
  - `backend/src/controllers/tenant.controller.ts` (`GET /tenant/resolve`)
  - `backend/src/routes/tenant.routes.ts`
  - `backend/src/middleware/resolve-tenant-by-host.ts` (factory + 404/400 handling)
  - `backend/src/middleware/tenant-context.ts` (`AsyncLocalStorage` + `getTenantContext`/`requireTenantContext`/`runWithTenantContext` + middleware Express)
  - `backend/src/subscribers/TenantSubscriber.ts` (`beforeInsert` injeta tenantId, `beforeUpdate` proíbe mudança)
  - `backend/src/utils/with-tenant.ts` (helper de `QueryBuilder` aplicando `WHERE tenant_id = :__tenantId`)
  - `backend/src/migrations/1746748000000-InitialSchema.ts` (schema + extension)
  - `backend/src/migrations/1746748100000-CreateTenantTable.ts` (`tb_tenant` + indexes)
  - `backend/src/app.ts` (`bypassFor` + pipeline `resolveTenantByHost` → `tenantContextMiddleware`)
  - `portal/src/lib/tenant/resolve.ts` (chama backend `GET /tenant/resolve` via fetch SSR, header `X-Forwarded-Host`)
  - `backend/__tests__/cross-tenant-isolation.test.ts` (13 cases: subscriber + withTenant)
  - `backend/__tests__/tenant-resolver.service.test.ts` (6 cases: resolve + cache + invalidate)
  - `backend/__tests__/tenant-resolve.e2e.test.ts`
**Resumo:** Resolve o tenant ativo a partir do `Host` (ou `X-Forwarded-Host` quando atrás de proxy) com cache Redis em `tenant:resolve:{host}` (TTL 10 min). Propaga tenant context via `AsyncLocalStorage`. Garante isolamento de dados em duas camadas: (1) helper `withTenant(qb)` aplica `WHERE` em queries explícitas; (2) `TenantSubscriber` global injeta `tenant_id` em INSERT e proíbe mudança em UPDATE, rejeitando cross-tenant em runtime.

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
| SPEC-20260512-1640 | withTenantScope com validacao UUID e docs operacionais | feature/SQU-33-helper-withtenant |

## Estado atual

### Schema

Tabela `scp.tb_tenant(tenant_id uuid PK, tenant_slug unique, tenant_host unique, tenant_flavor_slug, tenant_name, tenant_created_at, tenant_updated_at)`. Index `ix_tb_tenant_flavor_slug` pra validação CI eficiente. **Identidade visual NÃO vive aqui** — `tenant_flavor_slug` é apenas o ponteiro pra pasta em `portal/public/flavors/<slug>/` (Modelo A, ver feature `theme-system`).

Toda tabela multitenant futura carrega coluna `tenant_id uuid NOT NULL` + FK pra `tb_tenant(tenant_id)`. Property TS é `tenantId`.

### Resolução

`GET /tenant/resolve` recebe `req.hostname` (Express com `trust proxy = true` reflete `X-Forwarded-Host`). Pipeline:

1. Cache hit em Redis (`tenant:resolve:{host}`, TTL 600s) → retorna JSON com `{tenantId, slug, flavorSlug}` (medido: 3ms).
2. Cache miss → query Postgres via `TenantRepository.findByHost` → SET no Redis com EX 600 → retorna (medido: 77ms).
3. Host desconhecido → `null` → controller responde 404 `tenant_not_found`.

Invalidação manual: `TenantResolverService.invalidate(host)` faz `DEL tenant:resolve:{host}`. Chamada esperada após `UPDATE tb_tenant SET tenant_host = ...` ou `tenant_flavor_slug = ...` (operações raras). Por ora **sem endpoint dedicado** — operador roda SQL + `redis-cli del`. Endpoint vira responsabilidade do módulo admin quando existir.

### Tenant context

`tenantContextMiddleware` lê `req.tenant` (populado por `resolveTenantByHost`) e roda o resto da request com o ctx no `AsyncLocalStorage`. `requireAuth` (feature `auth`) também popula `req.tenant` a partir do JWT, independente do host (`/auth/*` bypassa resolveTenantByHost).

`withTenant(qb)` em repositories: `qb.andWhere(\`${alias}.tenant_id = :__tenantId\`, { __tenantId: ctx.tenantId })`. Lança `Error('No tenant context')` se chamado fora de uma request.

### Subscriber

`TenantSubscriber` é registrado no `AppDataSource` via glob. Global e implícito. Comportamento:

- `beforeInsert`: se entity tem property `tenantId` declarada e não foi setada manualmente, injeta do `AsyncLocalStorage`. Se setada e diverge do ctx (cross-tenant), **lança**. Sem ctx + sem `tenantId` manual: **lança** (insert sem isolamento bloqueado).
- `beforeUpdate`: se `updatedColumns` inclui `tenantId`, **lança** (mudança de tenant exige delete+insert explícito).
- Entity `Tenant` em si é ignorada (PK já É o tenant_id).
- Path do seed: setar `tenantId` manualmente sem ctx ativo passa (insert administrativo).

### Pipeline Express

```
helmet → cors → json/urlencoded/cookie-parser → morgan
  → /health (rota antes do middleware tenant)
  → bypassFor(['/health', '/auth/*'], resolveTenantByHostMiddleware)
  → bypassFor(['/health', '/auth/*'], tenantContextMiddleware)
  → tenantRoutes + authRoutes
  → 404 → error handler
```

`bypassFor(matcher, handler)` aceita lista mista de paths exatos e prefixos (`/auth/*`).

### Portal SSR

`portal/src/lib/tenant/resolve.ts` chama `${BACKEND_URL}/tenant/resolve` em request handler SSR, propagando `X-Forwarded-Host: ${host}` (não `Host`, ver Gotcha). Backend cacheia em Redis; portal usa `cache: 'no-store'` no fetch pra evitar dupla camada de cache.

> Última atualização: 2026-05-11 09:00 (SPEC-20260503-1505)

## Decisões arquiteturais ativas

- **Resolução de tenant no backend (não no Next)** (origem: SPEC-20260503-1505, 2026-05-08 14:31) — Portal SSR delega ao backend, que cacheia em Redis. Mantém uma fonte de verdade (DB+Redis), evita lógica duplicada.
- **Cache Redis com TTL 10 min** (origem: SPEC-20260503-1505, 2026-05-08 19:03) — `tenant:resolve:{host}`. TTL hard-coded em const no service; configurável via env só quando virar problema operacional. Invalidação explícita ao alterar `tenant_host`/`tenant_flavor_slug` (operação rara, normalmente do admin de tenants).
- **Tenant context via AsyncLocalStorage + middleware Express (não Nest interceptor)** (origem: SPEC-20260503-1505, 2026-05-08 16:43) — Coerente com decisão de stack (`infra-base`). Mais explícito, levemente mais boilerplate, debug claro.
- **Isolamento em duas camadas (`withTenant` + `TenantSubscriber`)** (origem: SPEC-20260503-1505, 2026-05-08 17:42) — `withTenant` é leitura explícita; subscriber é write implícito. Belt-and-suspenders. Subscriber **rejeita** cross-tenant ao invés de silently corrigir (fail-fast).
- **UPDATE de `tenant_id` é proibido** (origem: SPEC-20260503-1505, 2026-05-08 17:42) — Mudança de tenant exige delete+insert ou migration explícita. Não-trivial mas alinhado com semântica de isolamento.
- **`X-Forwarded-Host` no portal→backend (não `Host`)** (origem: SPEC-20260503-1505, 2026-05-09 09:55) — Node fetch (undici) reescreve `Host` a partir da URL. `X-Forwarded-Host` + `app.set('trust proxy', true)` no backend resolve. Também é o padrão de proxy reverso real (Nginx/CloudFront).
- **Sem endpoint dedicado de invalidação** (origem: SPEC-20260503-1505, 2026-05-11 09:00) — Por ora operador roda SQL + `redis-cli del`. Vira side-effect de mutação quando módulo admin de tenants existir.

## Alternativas consideradas e rejeitadas

- **Resolução no Next.js direto (sem backend)** (2026-05-08 14:31) — Faria portal ler `tb_tenant` server-side. Rejeitada por duplicar lógica e perder o cache Redis centralizado. Backend única fonte de verdade.
- **`Host` header literal no fetch portal→backend** (2026-05-09 09:55) — Falha porque undici sobrescreve `Host` a partir da URL (backend recebia `localhost:3001`). Trocado por `X-Forwarded-Host`.
- **Regex inline pra bypassar `/health` no pipeline** (`app.use(/^(?!\/health).*/, ...)`) (2026-05-08 19:03) — Rejeitada por menos legível que `bypassFor(['/health'], handler)`.
- **Container DI (tsyringe/awilix)** (2026-05-08 19:03) — Hoje composition root manual em `server.ts` é suficiente. Reavaliar quando boilerplate doer com 10+ services.

## Gotchas

- **`@types/supertest` sem `@types/superagent`** (2026-05-08 19:03) — `Test extends STest` mas `STest` precisa de `@types/superagent` instalado pra expor `.set()`. Sem isso, tsc reclama "Property 'set' does not exist on type 'Test'". Fix: instalar `@types/superagent` como devDep do backend.
- **`req.path` exato no `bypassFor` original** (2026-05-09 19:45) — Versão antiga usava `Set<string>` de match exato; auth com `/auth/*` exigiu prefixo. Fix: `bypassFor` virou predicate-based (aceita paths exatos OU prefixos com `*`).
- **Subscriber `'tenantId' in entity` em testes** (2026-05-11 08:50) — Pra cobrir caso "tem a property mas valor undefined", entity tem que ser literalmente `{ tenantId: undefined }`. `{}` não tem a key e o subscriber retorna cedo.
- **Cache key ainda servindo valor antigo após UPDATE no DB** (2026-05-11 08:50) — Comportamento esperado: cache é stale-tolerant. Operador roda `redis-cli del tenant:resolve:{host}` (manual via SQL + redis) ou aguarda 10 min de TTL.

## Estado congelado (se houver)

_(nenhum)_

