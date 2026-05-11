# SPEC-20260506-1400: Endpoints públicos de lojas com cache Redis

**Status:** active
**Criada:** 2026-05-06 14:00
**Ativada:** 2026-05-06 14:00
**Concluída:** —
**Commit final:** —
**Keywords:** stores, public-api, redis, cache, listagem, paginacao, filtros
**Features:** stores-public-api
**Branch:** feature/SQU-43-api-publica
**Depende de:** SPEC-20260503-1506-modulo-lojas (schema `tb_store`, `tb_category`, `tb_store_category`)
**Origem:** usuário em 2026-05-06 14:00. **Re-escopada em 2026-05-11 17:24** após merge de `main` em `c789654` que trouxe a SPEC-20260503-1505 concluída — stack do backend mudou de Next.js App Router + Drizzle para **Express 4 + TypeORM 0.3**, invalidando a implementação anterior.
**Resumo:** Implementar GET /api/v1/stores (listagem com filtros e paginação), público, com cache Redis de 5 min e headers HTTP para CDN futura. Endpoint de detalhe (`/[slug]`) fica para SPEC futura.

## Objetivo

Expor a listagem de lojas ativas ao frontend público (portal do visitante) sem autenticação. Reduzir carga no banco via cache Redis com invalidação automática ao salvar/deletar lojas no admin.

## Escopo

**DENTRO:**
- `GET /api/v1/stores` com filtros: `category`, `featured`, `is_restaurant`, `search` (ILIKE), `page`, `limit` (max 50)
- Helper de cache reutilizável: `cached(key, ttl, fetchFn)` + `invalidateStoresCache(tenantId)` via SCAN
- Headers `Cache-Control: public, max-age=300, s-maxage=300` + `Vary: x-forwarded-host` + `X-Cache: HIT | MISS`
- Loja com `store_status != 'active'` não aparece na listagem
- Invalidação chamada em todos endpoints admin de stores/categories (definidos pela SPEC-1506)

**FORA:**
- `GET /api/v1/stores/[slug]` (detalhe) — escopo da `SPEC-20260508-1400-stores-public-detail` (em `future/`)
- Full-text search real (ILIKE apenas — FTS vem na v2.5)
- Cache para CDN (só headers preparatórios — integração CDN é outra SPEC)
- Autenticação / rate limiting por IP
- Endpoints de escrita (POST/PUT/DELETE) — escopo da SPEC-1506
- Schema/migrations do banco — escopo da SPEC-1506

## Implementação

**Stack** (pós-merge `c789654`): **Express 4 + TypeORM 0.3 + ioredis**. Estrutura espelha o resto do backend (`controllers/services/repositories/routes/dtos/utils`), entregue pela SPEC-1505.

**Tenant resolution:** sem `x-tenant-id` no header. O `tenantId` corrente vem do **`AsyncLocalStorage`** populado pelo `tenantContextMiddleware` (já entregue pela SPEC-1505), que resolve `host` HTTP → `tb_tenant` via `/tenant/resolve` cacheado em Redis. Acesso via `getTenantId()` / `withTenant(qb)` do `backend/src/middleware/tenant.context.ts` (ou equivalente — confirmar nome exato com código real ao desbloquear).

**Schema assumido (TypeORM, entregue pela SPEC-1506):**
- `tb_store`: `store_id` (uuid pk), `tenant_id`, `store_name`, `store_slug`, `store_logo_url`, `store_cover_image_url`, `store_floor`, `store_phone`, `store_is_restaurant`, `store_is_featured`, `store_status`, `store_sort_order`, timestamps
- `tb_category`: `category_id`, `tenant_id`, `category_slug`, `category_name`, timestamps
- `tb_store_category`: `store_id`, `category_id`, `tenant_id` (join, com `tenant_id` redundante para defesa em profundidade)

> Naming final pode ajustar quando a SPEC-1506 for executada — re-confirmar na ativação dela.

**Chave de cache — listagem:**
`stores:list:{tenant_id}:cat={v}:feat={v}:l={v}:p={v}:q={v}:rest={v}` (params ordenados alfabeticamente; `search` normalizado para lowercase+trim antes de compor a chave).

**Invalidação:** SCAN cursor + DEL (nunca KEYS em produção). Padrão: `stores:list:{tenant_id}:*`.

**Fallback Redis:** se Redis cair, query no banco sem erro 500 (degradação graciosa). Mesmo padrão usado pelo `/tenant/resolve` da SPEC-1505 — vale checar se já há helper genérico de cache no backend antes de criar um novo.

**Tenant isolation:** toda query usa o helper `withTenant(qb)` que injeta `WHERE tenant_id = $1` automaticamente. JOIN com `tb_category` via `tb_store_category` também filtra por `tenant_id` (defesa em profundidade — subscriber TypeORM já garante em inserts, mas selects cruzados ainda exigem WHERE explícito).

**Arquivos planejados** (caminhos finais a confirmar com convenção real do backend ao desbloquear):
- `backend/src/utils/cache.ts` ou `backend/src/services/cache.service.ts` (novo, ou reusar se já existir)
- `backend/src/controllers/store.controller.ts` (novo) — handler do `GET /api/v1/stores`
- `backend/src/services/store.service.ts` (novo) — orquestra cache + repository + montagem da resposta
- `backend/src/repositories/store.repository.ts` (novo) — query builder TypeORM com filtros
- `backend/src/routes/store.routes.ts` (novo) — registra `/api/v1/stores` no Express
- `backend/src/dtos/store-list.dto.ts` (novo) — tipos de request/response
- Endpoints admin de stores/categories (SPEC-1506): chamar `invalidateStoresCache(tenantId)` em insert/update/delete

**Código deletado em 2026-05-11 17:24** (não migrado, pois mudou stack + ORM):
- `backend/lib/cache.ts` — implementação Drizzle/Next.js
- `backend/app/api/v1/stores/route.ts` — handler Next.js App Router com Drizzle

**Gotchas conhecidos:**
- Usar SCAN, nunca KEYS — bloqueia Redis em produção
- `Vary: x-forwarded-host` obrigatório — sem isso CDN serve dados de outro tenant (era `x-tenant-id` na implementação anterior; agora o tenant é resolvido pelo host real, então `Vary` precisa cobrir o header de host real visto pelo backend atrás do proxy — confirmar na implementação)
- Filtros DEVEM compor a cache key — cache hit com filtros errados retorna dados incorretos
- JOIN `tb_category` via `tb_store_category` deve incluir `tenant_id` — sem isso vaza categorias de outros tenants
- `limit > 50` é ajustado silenciosamente para 50, não erro 400
- `%` e `_` no `search` precisam ser escapados antes do ILIKE (regressão da implementação anterior: já foi resolvido em `bf21c78` no código Drizzle, mas precisa ser **re-entregue** no código TypeORM)
- `search` precisa ser normalizado (lowercase + trim) ANTES de compor cache key e query (mesma situação)

## Critério de aceite

- [ ] `GET /api/v1/stores` retorna 200 com `{ data, total, page, limit }`
- [ ] Filtros `category` + `featured` + `is_restaurant` + `search` funcionam combinados
- [ ] Paginação retorna metadata correta (`total` real, não da página)
- [ ] Segunda chamada idêntica retorna `X-Cache: HIT`
- [ ] Invalidação dispara `MISS` após POST/PUT/DELETE no admin
- [ ] Loja com `store_status != 'active'` não aparece na listagem
- [ ] `limit=100` é ajustado para 50 automaticamente
- [ ] Header `Cache-Control: public, max-age=300, s-maxage=300` presente
- [ ] Header `Vary: x-forwarded-host` (ou equivalente do tenant resolution real) presente
- [ ] Redis fora do ar não causa 500 (fallback para DB)
- [ ] Wildcards SQL (`%`, `_`) escapados no parâmetro `search` antes do ILIKE (anteriormente entregue em `bf21c78` sobre Drizzle/Next.js — código deletado em 2026-05-11 17:24, precisa ser re-entregue sobre TypeORM)
- [ ] `search` normalizado (lowercase + trim) antes de compor cache key (mesma situação)
- [ ] Implementação usa entidades TypeORM (`tb_store`, `tb_category`, `tb_store_category`) entregues pela SPEC-20260503-1506
- [ ] Tenant resolvido via `AsyncLocalStorage` + `withTenant(qb)` (SPEC-1505), sem header `x-tenant-id`
- [ ] Testes mínimos cobrindo: isolamento por tenant, fallback Redis, cache HIT/MISS
- [ ] **Features tocadas (stores-public-api) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
