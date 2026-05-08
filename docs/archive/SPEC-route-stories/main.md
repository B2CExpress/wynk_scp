# SPEC-20260506-1400: Endpoints públicos de lojas com cache Redis

**Status:** active
**Criada:** 2026-05-06 14:00
**Ativada:** 2026-05-06 14:00
**Concluída:** —
**Commit final:** —
**Keywords:** stores, public-api, redis, cache, listagem, detalhe, paginacao, filtros
**Features:** stores-public-api
**Branch:** feature/SQU-43-api-publica
**Depende de:** —
**Origem:** usuário em 2026-05-06 14:00
**Resumo:** Implementar GET /api/v1/stores (listagem com filtros e paginação) e GET /api/v1/stores/[slug] (detalhe), ambos públicos, com cache Redis de 5 min e headers HTTP para CDN futura.

## Objetivo

Expor dados de lojas ativas ao frontend público (portal do visitante) sem autenticação. Reduzir carga no banco via cache Redis com invalidação automática ao salvar/deletar lojas no admin.

## Escopo

**DENTRO:**
- GET /api/v1/stores com filtros: category, featured, is_restaurant, search (ILIKE), page, limit (max 50)
- GET /api/v1/stores/[slug] retornando detalhe completo com opening_hours e categories
- Helper lib/cache.ts: cached(key, ttl, fetchFn) + invalidateStoresCache(tenantId) via SCAN
- Headers Cache-Control: public, max-age=300, s-maxage=300 + Vary: x-tenant-id
- Header X-Cache: HIT | MISS
- 404 para slug inexistente, de outro tenant, ou status != active
- Invalidação chamada em todos endpoints admin de stores/categories

**FORA:**
- Full-text search real (busca com ILIKE apenas — FTS vem na v2.5)
- Cache para CDN (só headers preparatórios — integração CDN é outra SPEC)
- Autenticação / rate limiting por IP
- Endpoints de escrita (POST/PUT/DELETE)
- Schema/migrations do banco (outra SPEC)

## Implementação

**Stack:** Next.js App Router (backend/), Drizzle ORM, ioredis.

**Chave de cache — listagem:**
`stores:list:{tenant_id}:cat={v}:feat={v}:l={v}:p={v}:q={v}:rest={v}` (params ordenados alfabeticamente)

**Chave de cache — detalhe:**
`stores:detail:{tenant_id}:{slug}`

**Invalidação:** SCAN cursor + DEL (nunca KEYS em produção). Padrão: `stores:list:{tenant_id}:*` para lista; key exata para detalhe.

**Fallback Redis:** se Redis cair, query no banco sem erro 500 (degradação graciosa).

**Tenant isolation:** toda query inclui `eq(stores.tenantId, tenantId)`. JOIN com categories também filtra por `tenantId` para evitar vazamento entre tenants.

**Schema assumido (Drizzle):**
- `stores`: id, tenant_id, name, slug, description, logo_url, cover_image_url, external_url, floor, phone, opening_hours (jsonb), is_restaurant, is_featured, status, sort_order
- `categories`: id, tenant_id, slug, name
- `store_categories`: store_id, category_id, tenant_id

**Arquivos afetados:**
- `backend/lib/cache.ts` (novo)
- `backend/app/api/v1/stores/route.ts` (novo)
- `backend/app/api/v1/stores/[slug]/route.ts` (novo)
- Qualquer endpoint admin de stores/categories: adicionar chamada a `invalidateStoresCache`

**Gotchas conhecidos:**
- Usar SCAN, nunca KEYS — bloqueia Redis em produção
- `Vary: x-tenant-id` obrigatório — sem isso CDN serve dados de outro tenant
- Filtros DEVEM compor a cache key — cache hit com filtros errados retorna dados incorretos
- JOIN categories deve incluir `tenantId` — sem isso vaza categorias de outros tenants
- `limit > 50` é ajustado silenciosamente para 50, não erro 400

## Critério de aceite

- [ ] GET /api/v1/stores retorna 200 com { data, total, page, limit }
- [ ] Filtros category + featured + is_restaurant + search funcionam combinados
- [ ] Paginação retorna metadata correta (total real, não da página)
- [ ] Segunda chamada idêntica retorna X-Cache: HIT
- [ ] Invalidação dispara MISS após POST/PUT/DELETE no admin
- [ ] GET /api/v1/stores/starbucks de tenant sem essa loja retorna 404
- [ ] Loja com status != active retorna 404 no detalhe e não aparece na listagem
- [ ] limit=100 é ajustado para 50 automaticamente
- [ ] Header Cache-Control: public, max-age=300, s-maxage=300 presente
- [ ] Header Vary: x-tenant-id presente
- [ ] Redis fora do ar não causa 500 (fallback para DB)
- [ ] **Features tocadas (stores-public-api) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado

Ação pendente para você (dev):

Ajustar os imports @/lib/db e @/lib/schema ao schema Drizzle real quando ele existir (colunas estão em camelCase Drizzle mapeando snake_case do banco).
Chamar invalidateAllStoresCaches(tenantId, slug?) em todos os endpoints admin que fazem POST/PUT/DELETE em stores e categories.