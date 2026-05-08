# SPEC-20260508-1400: Endpoint público de detalhe de loja por slug

**Status:** draft
**Criada:** 2026-05-08 14:00
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** stores, public-api, detail, slug, redis, cache, 404-unificado, tenant-isolation
**Features:** stores-public-api
**Branch:** — (futura)
**Depende de:** SPEC-20260506-1400 (listagem + base do `lib/cache.ts`)
**Origem:** extraída de SPEC-20260506-1400 em 2026-05-08 13:50 — escopo separado após dev confirmar que detalhe subiu por engano em `96b5a33` e foi removido em `759eca5`.
**Resumo:** Implementar `GET /api/v1/stores/[slug]` (detalhe público) com cache Redis de 5 min e 404 unificado para evitar enumeração cross-tenant.

## Objetivo

Expor o detalhe completo de uma loja ativa ao portal público (visitante). O retorno inclui campos não cobertos pela listagem (`description`, `external_url`, `opening_hours`, `categories`). Reutilizar a infra de cache já entregue pela SPEC-20260506-1400 e estender com chave de detalhe e invalidação por slug.

## Escopo

**DENTRO:**
- `GET /api/v1/stores/[slug]` retornando: `id`, `name`, `slug`, `description`, `logo_url`, `cover_image_url`, `external_url`, `floor`, `phone`, `opening_hours`, `is_restaurant`, `categories[]`.
- Chave de cache: `stores:detail:{tenant_id}:{slug}` (TTL 5 min).
- Headers HTTP: `Cache-Control: public, max-age=300, s-maxage=300`, `Vary: x-tenant-id`, `X-Cache: HIT | MISS`.
- **404 unificado** para os 3 casos: slug inexistente, slug de outro tenant, loja com `status != active`. Mesma resposta para os três — atacante NÃO consegue enumerar slugs cross-tenant.
- Invalidação ao salvar/deletar no admin: chave exata `stores:detail:{tenant_id}:{slug}`. **Rename de slug deve invalidar slug antigo + slug novo.**
- Extração de helpers compartilhados para `backend/lib/api-helpers.ts` (`requireTenantId`, `cacheHeaders`). Listagem (`route.ts`) refatorada para usar.

**FORA:**
- Listagem (já é SPEC-20260506-1400).
- Endpoints de escrita (POST/PUT/DELETE).
- Schema/migrations do banco (outra SPEC).
- Full-text search.
- Autenticação / rate limiting.

## Implementação

**Stack:** Next.js App Router, Drizzle ORM, ioredis (já em uso pela SPEC-20260506-1400).

**Query:** filtro por `tenantId + slug + status='active'` em uma única `WHERE`. Se nada bate → 404. Em seguida JOIN `store_categories × categories` filtrado por `tenantId` para anexar categorias.

**Cache:**
- Chave: `stores:detail:{tenant_id}:{slug}`.
- `cached()` (já em `lib/cache.ts`) reutilizado.
- Resposta `null` (slug inexistente) **é cacheada** — 404 por 5 min, anti-stampede. Aceito como decisão consciente: até a próxima invalidação rodar, a criação de uma nova loja não fica imediatamente acessível pelo slug.

**Invalidação:**
- Adicionar `invalidateStoreDetailCache(tenantId, slug)` em `lib/cache.ts`.
- Estender `invalidateAllStoresCaches(tenantId, slugs?: string | string[])` para aceitar 1+ slugs — necessário para rename (passar `[oldSlug, newSlug]`).
- Endpoints admin de stores precisam chamar a invalidação corretamente. Em rename: passar slug antigo + novo.

**Helpers extraídos (`backend/lib/api-helpers.ts`):**
- `requireTenantId(request: NextRequest): string | NextResponse` — retorna tenant ou resposta 400.
- `cacheHeaders(hit: boolean): Record<string, string>` — gera os 3 headers padrão.
- `STORE_CACHE_TTL = 300`.
- `interface StoreCategory { slug: string; name: string }`.
- `fetchStoreCategories(storeIds: string[], tenantId: string): Promise<Record<string, StoreCategory[]>>` — JOIN reutilizado por listagem (1 query agrupada) e detalhe (filtra para 1 store).

**Schema assumido (Drizzle):** mesmo da SPEC-20260506-1400, com colunas extras consumidas pelo detalhe: `description`, `external_url`, `opening_hours` (jsonb).

**Arquivos afetados:**
- `backend/app/api/v1/stores/[slug]/route.ts` (novo).
- `backend/lib/cache.ts` (adicionar `buildStoreDetailCacheKey`, `invalidateStoreDetailCache`; estender `invalidateAllStoresCaches`).
- `backend/lib/api-helpers.ts` (novo).
- `backend/app/api/v1/stores/route.ts` (refactor: usar helpers).
- Endpoints admin de stores: invalidar slug antigo + novo em rename.

**Gotchas conhecidos:**
- **404 unificado é regra de segurança** — diferenciar 404 (não existe) de 403 (existe mas é de outro tenant) expõe enumeração cross-tenant. Atacante consegue mapear quais slugs existem em quais tenants. Manter sempre o mesmo 404.
- **Rename de slug exige invalidar slug antigo + novo** — se só o novo for invalidado, antigo continua servindo dados velhos pelo TTL inteiro.
- **Cache de `null` (404) é desejado** — evita stampede em slugs frequentemente buscados e inexistentes. Trade-off: criação de loja com slug que já era buscado fica invisível até a próxima invalidação rodar.
- **`opening_hours` é jsonb** — formato definido no admin. Sem validação runtime no GET; lixo entra, lixo sai. Documentar contrato no admin.
- **Helpers só fazem sentido a partir do 2º endpoint** — extração foi adiada na SPEC-20260506-1400 (1 endpoint, sem duplicação real). Esta SPEC introduz o 2º e justifica a extração.

## Critério de aceite

- [ ] `GET /api/v1/stores/[slug]` retorna 200 com detalhe completo (campos esperados, com `categories[]` populado)
- [ ] Slug inexistente retorna 404
- [ ] Slug pertencente a outro tenant retorna 404 (resposta idêntica — sem enumeração)
- [ ] Loja com `status != active` retorna 404
- [ ] Segunda chamada idêntica retorna `X-Cache: HIT`
- [ ] Invalidação dispara `MISS` após POST/PUT/DELETE no admin
- [ ] Rename de slug invalida slug antigo + novo (`invalidateAllStoresCaches(tenantId, [old, new])`)
- [ ] Headers `Cache-Control: public, max-age=300, s-maxage=300`, `Vary: x-tenant-id`, `X-Cache: HIT|MISS` presentes
- [ ] Redis fora do ar não causa 500 (fallback para DB)
- [ ] Helpers compartilhados extraídos para `backend/lib/api-helpers.ts`; `route.ts` (listagem) refatorado para usar
- [ ] Imports `@/lib/db` e `@/lib/schema` apontam para schema Drizzle real
- [ ] Testes mínimos: 404 cross-tenant, 404 status inativo, cache HIT/MISS, fallback Redis, rename invalidation
- [ ] **Features tocadas (stores-public-api) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
