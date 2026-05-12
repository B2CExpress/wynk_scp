# Feature: tenant-resolution

**Keywords:** multitenant, tenant_id, host, middleware, cache, redis, isolamento, async-local-storage, subscriber
**Arquivos principais:**
  - `backend/src/entities/Tenant.ts` (tabela `tb_tenant` - identidade operacional, sem branding)
  - `backend/src/repositories/tenant.repository.ts` (`findByHost`, `findBySlug`, `findById`)
  - `backend/src/config/{index,redis}.ts` (`REDIS_URL`, `CACHE_TTL_TENANT_SECONDS`, singleton do `ioredis`)
  - `backend/src/services/tenant-resolver.service.ts` (resolve + cache Redis best-effort + `invalidateTenantCache`)
  - `backend/src/controllers/tenant.controller.ts` (`GET /tenant/resolve`)
  - `backend/src/routes/tenant.routes.ts`
  - `backend/src/middleware/resolve-tenant-by-host.ts` (factory + 404/400 handling)
  - `backend/src/middleware/tenant-context.ts` (`AsyncLocalStorage` + `getTenantContext`/`requireTenantContext`/`runWithTenantContext` + middleware Express)
  - `backend/src/subscribers/TenantSubscriber.ts` (`beforeInsert` injeta tenantId, `beforeUpdate` proibe mudanca)
  - `backend/src/utils/with-tenant.ts` (helper de `QueryBuilder` aplicando `WHERE tenant_id = :__tenantId`)
  - `backend/src/migrations/1746748000000-InitialSchema.ts` (schema + extension)
  - `backend/src/migrations/1746748100000-CreateTenantTable.ts` (`tb_tenant` + indexes)
  - `backend/src/app.ts` (`bypassFor` + pipeline `resolveTenantByHost` -> `tenantContextMiddleware`)
  - `portal/src/lib/tenant/resolve.ts` (chama backend `GET /tenant/resolve` via fetch SSR, header `X-Forwarded-Host`)
  - `backend/__tests__/cross-tenant-isolation.test.ts` (13 cases: subscriber + withTenant)
  - `backend/__tests__/tenant-resolver.service.test.ts` (9 cases: resolve + cache + fallback + invalidate)
  - `backend/__tests__/tenant-resolve.e2e.test.ts`
**Resumo:** Resolve o tenant ativo a partir do `Host` (ou `X-Forwarded-Host` quando atras de proxy) com cache Redis em `tenant:resolve:{host}`. O cache e best-effort: `GET`, `SET` e `DEL` falham sem derrubar a request, com fallback para Postgres e logs estruturados. TTL vem de `CACHE_TTL_TENANT_SECONDS` (default 600). Propaga tenant context via `AsyncLocalStorage` e garante isolamento de dados em duas camadas: (1) helper `withTenant(qb)` aplica `WHERE` em queries explicitas; (2) `TenantSubscriber` global injeta `tenant_id` em INSERT e proibe mudanca em UPDATE, rejeitando cross-tenant em runtime.

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

### Schema

Tabela `scp.tb_tenant(tenant_id uuid PK, tenant_slug unique, tenant_host unique, tenant_flavor_slug, tenant_name, tenant_created_at, tenant_updated_at)`. Index `ix_tb_tenant_flavor_slug` para validacao CI eficiente. **Identidade visual nao vive aqui** - `tenant_flavor_slug` e apenas o ponteiro para a pasta em `portal/public/flavors/<slug>/` (Modelo A, ver feature `theme-system`).

Toda tabela multitenant futura carrega coluna `tenant_id uuid NOT NULL` + FK para `tb_tenant(tenant_id)`. Property TS e `tenantId`.

### Resolucao

`GET /tenant/resolve` recebe `req.hostname` (Express com `trust proxy = true` reflete `X-Forwarded-Host`). Pipeline:

1. Tenta `GET tenant:resolve:{host}` no Redis.
2. Se houver payload valido, retorna `{tenantId, slug, flavorSlug}` e loga `tenant cache HIT`.
3. Cache miss loga `tenant cache MISS` e consulta Postgres via `TenantRepository.findByHost`.
4. Se o `GET` do Redis falhar, loga warning e cai para o banco sem quebrar a request.
5. Tenant encontrado -> tenta `SET EX <CACHE_TTL_TENANT_SECONDS>` no Redis; falha de `SET` tambem nao quebra a request.
6. Host desconhecido -> `null` -> controller responde 404 `tenant_not_found`. `null` nao e cacheado.

TTL e configuravel via `CACHE_TTL_TENANT_SECONDS` (default 600). A conexao com Redis usa `REDIS_URL` como fonte principal, com fallback para `REDIS_HOST`/`REDIS_PORT` apenas por compatibilidade.

Invalidacao manual: `TenantResolverService.invalidate(host)` e `invalidateTenantCache(host)` fazem `DEL tenant:resolve:{host}` em modo best-effort (warning se falhar, sem throw). Chamada esperada apos `UPDATE tb_tenant SET tenant_host = ...` ou `tenant_flavor_slug = ...` (operacoes raras). Por ora **sem endpoint dedicado** - operador roda SQL + `redis-cli del`. Endpoint vira responsabilidade do modulo admin quando existir.

### Tenant context

`tenantContextMiddleware` le `req.tenant` (populado por `resolveTenantByHost`) e roda o resto da request com o ctx no `AsyncLocalStorage`. `requireAuth` (feature `auth`) tambem popula `req.tenant` a partir do JWT, independente do host (`/auth/*` bypassa `resolveTenantByHost`).

`withTenant(qb)` em repositories: `qb.andWhere(\`${alias}.tenant_id = :__tenantId\`, { __tenantId: ctx.tenantId })`. Lanca `Error('No tenant context')` se chamado fora de uma request.

### Subscriber

`TenantSubscriber` e registrado no `AppDataSource` via glob. Global e implicito. Comportamento:

- `beforeInsert`: se entity tem property `tenantId` declarada e nao foi setada manualmente, injeta do `AsyncLocalStorage`. Se setada e diverge do ctx (cross-tenant), lanca. Sem ctx + sem `tenantId` manual: lanca (insert sem isolamento bloqueado).
- `beforeUpdate`: se `updatedColumns` inclui `tenantId`, lanca (mudanca de tenant exige delete+insert explicito).
- Entity `Tenant` em si e ignorada (PK ja e o tenant_id).
- Path do seed: setar `tenantId` manualmente sem ctx ativo passa (insert administrativo).

### Pipeline Express

```text
helmet -> cors -> json/urlencoded/cookie-parser -> morgan
  -> /health (rota antes do middleware tenant)
  -> bypassFor(['/health', '/auth/*'], resolveTenantByHostMiddleware)
  -> bypassFor(['/health', '/auth/*'], tenantContextMiddleware)
  -> tenantRoutes + authRoutes
  -> 404 -> error handler
```

`bypassFor(matcher, handler)` aceita lista mista de paths exatos e prefixos (`/auth/*`).

### Portal SSR

`portal/src/lib/tenant/resolve.ts` chama `${BACKEND_URL}/tenant/resolve` em request handler SSR, propagando `X-Forwarded-Host: ${host}` (nao `Host`, ver Gotcha). Backend cacheia em Redis; portal usa `cache: 'no-store'` no fetch para evitar dupla camada de cache.

> Ultima atualizacao: 2026-05-12 16:01 (SPEC-20260512-1601)

## Decisoes arquiteturais ativas

- **Resolucao de tenant no backend (nao no Next)** (origem: SPEC-20260503-1505, 2026-05-08 14:31) - Portal SSR delega ao backend, que cacheia em Redis. Mantem uma fonte de verdade (DB+Redis), evita logica duplicada.
- **Cache Redis de tenant e best-effort + TTL configuravel por env** (origem: SPEC-20260512-1601, 2026-05-12 16:01) - `tenant:resolve:{host}` continua sendo a chave canonica, mas Redis virou aceleracao opcional: `GET`, `SET` e `DEL` falham sem derrubar a request. TTL vem de `CACHE_TTL_TENANT_SECONDS` (default 600), e a conexao usa `REDIS_URL`.
- **Cache Redis com TTL 10 min** (origem: SPEC-20260503-1505, 2026-05-08 19:03) [obsoleta desde 2026-05-12 16:01, substituida por SPEC-20260512-1601]
- **Tenant context via AsyncLocalStorage + middleware Express (nao Nest interceptor)** (origem: SPEC-20260503-1505, 2026-05-08 16:43) - Coerente com decisao de stack (`infra-base`). Mais explicito, levemente mais boilerplate, debug claro.
- **Isolamento em duas camadas (`withTenant` + `TenantSubscriber`)** (origem: SPEC-20260503-1505, 2026-05-08 17:42) - `withTenant` e leitura explicita; subscriber e write implicito. Belt-and-suspenders. Subscriber rejeita cross-tenant ao inves de silently corrigir (fail-fast).
- **UPDATE de `tenant_id` e proibido** (origem: SPEC-20260503-1505, 2026-05-08 17:42) - Mudanca de tenant exige delete+insert ou migration explicita. Nao-trivial, mas alinhado com semantica de isolamento.
- **`X-Forwarded-Host` no portal->backend (nao `Host`)** (origem: SPEC-20260503-1505, 2026-05-09 09:55) - Node fetch (undici) reescreve `Host` a partir da URL. `X-Forwarded-Host` + `app.set('trust proxy', true)` no backend resolve. Tambem e o padrao de proxy reverso real (Nginx/CloudFront).
- **Sem endpoint dedicado de invalidacao** (origem: SPEC-20260503-1505, 2026-05-11 09:00) - Por ora operador roda SQL + `redis-cli del`. Vira side-effect de mutacao quando modulo admin de tenants existir.

## Alternativas consideradas e rejeitadas

- **Resolucao no Next.js direto (sem backend)** (2026-05-08 14:31) - Faria portal ler `tb_tenant` server-side. Rejeitada por duplicar logica e perder o cache Redis centralizado. Backend unica fonte de verdade.
- **`Host` header literal no fetch portal->backend** (2026-05-09 09:55) - Falha porque undici sobrescreve `Host` a partir da URL (backend recebia `localhost:3001`). Trocado por `X-Forwarded-Host`.
- **Regex inline para bypassar `/health` no pipeline** (`app.use(/^(?!\/health).*/, ...)`) (2026-05-08 19:03) - Rejeitada por menos legivel que `bypassFor(['/health'], handler)`.
- **Container DI (tsyringe/awilix)** (2026-05-08 19:03) - Hoje composition root manual em `server.ts` e suficiente. Reavaliar quando boilerplate doer com 10+ services.

## Gotchas

- **`@types/supertest` sem `@types/superagent`** (2026-05-08 19:03) - `Test extends STest` mas `STest` precisa de `@types/superagent` instalado para expor `.set()`. Sem isso, tsc reclama "Property 'set' does not exist on type 'Test'". Fix: instalar `@types/superagent` como devDep do backend.
- **`req.path` exato no `bypassFor` original** (2026-05-09 19:45) - Versao antiga usava `Set<string>` de match exato; auth com `/auth/*` exigiu prefixo. Fix: `bypassFor` virou predicate-based (aceita paths exatos ou prefixos com `*`).
- **Subscriber `'tenantId' in entity` em testes** (2026-05-11 08:50) - Para cobrir o caso "tem a property mas valor undefined", a entity tem que ser literalmente `{ tenantId: undefined }`. `{}` nao tem a key e o subscriber retorna cedo.
- **Cache key ainda servindo valor antigo apos UPDATE no DB** (2026-05-11 08:50) - Comportamento esperado: cache e stale-tolerant. Operador roda `redis-cli del tenant:resolve:{host}` (manual via SQL + redis) ou aguarda o TTL natural.
- **Payload corrompido no Redis agora falha fechado** (2026-05-12 16:01, SPEC-20260512-1601) - O service valida o shape do JSON antes de tratar como `TenantContext`. Se o payload estiver invalido, a request cai no fluxo de warning + fallback para banco em vez de propagar `any`.

## Estado congelado (se houver)

_(nenhum)_
