# SPEC-20260506-1400: Endpoints públicos de lojas com cache Redis (+ schema mínimo)

**Status:** active
**Criada:** 2026-05-06 14:00
**Ativada:** 2026-05-06 14:00
**Concluída:** —
**Commit final:** —
**Keywords:** stores, public-api, redis, cache, listagem, paginacao, filtros, schema-minimo, entities, migration
**Features:** stores-public-api
**Branch:** feature/SQU-43-api-publica
**Depende de:** — (schema agora entregue por esta própria SPEC após re-escopo de 2026-05-12)
**Origem:** usuário em 2026-05-06 14:00. **Re-escopada em 2026-05-11 17:24** após merge de `main` em `c789654` que trouxe a SPEC-20260503-1505 concluída — stack mudou de Next.js+Drizzle para Express+TypeORM. **Re-escopada novamente em 2026-05-12 12:42** após dev confirmar que a SPEC-20260503-1506-modulo-lojas foi adiada — o schema mínimo de leitura agora cabe nesta SPEC para destravar entrega de valor.
**Resumo:** Entregar o schema mínimo de lojas (`tb_store`, `tb_category`, `tb_store_category`) suficiente para leitura pública + `GET /api/v1/stores` (listagem com filtros e paginação), público, com cache Redis de 5 min e headers HTTP para CDN futura. CRUD admin e endpoint de detalhe ficam para SPECs futuras.

## Objetivo

Expor a listagem de lojas ativas ao frontend público (portal do visitante) sem autenticação, e entregar **o schema mínimo viável de lojas** para destravar essa listagem (a SPEC-1506 que originalmente entregaria o schema foi adiada). Reduzir carga no banco via cache Redis com headers preparados para CDN. O schema é deliberadamente enxuto: só o necessário pra listagem pública — admin/CRUD podem evoluir o schema em SPEC futura sem conflito.

## Escopo

**DENTRO:**
- Entidades TypeORM: `Store`, `Category`, `StoreCategory` em `backend/src/entities/`
- Migration única criando `tb_store`, `tb_category`, `tb_store_category` com índices essenciais (PKs, FK por `tenant_id`, índice em `store_slug` e `category_slug` por tenant)
- `GET /api/v1/stores` com filtros: `category`, `featured`, `is_restaurant`, `search` (ILIKE), `page`, `limit` (max 50)
- Helper de cache reutilizável: `cached(key, ttl, fetchFn)` + `invalidateStoresCache(tenantId)` via SCAN (avaliar reuso/extração se SPEC-1505 já entregou helper genérico)
- Headers `Cache-Control: public, max-age=300, s-maxage=300` + `Vary: <header de tenant resolution>` + `X-Cache: HIT | MISS`
- Loja com `store_status != 'active'` não aparece na listagem
- Tenant isolation via `withTenant(qb)` + subscriber TypeORM em INSERTs (já entregue pela SPEC-1505)

**FORA:**
- `GET /api/v1/stores/[slug]` (detalhe) — escopo da `SPEC-20260508-1400-stores-public-detail` (em `future/`)
- CRUD admin de stores/categories (POST/PUT/DELETE + invalidação de cache disparada por eles) — escopo de SPEC futura
- Full-text search real (ILIKE apenas — FTS vem na v2.5)
- Cache para CDN (só headers preparatórios — integração CDN é outra SPEC)
- Autenticação / rate limiting por IP
- Colunas avançadas no schema (horários de funcionamento, geo, avaliações, etc.) — adicionadas em SPECs futuras quando admin/UX exigirem
- Seed de lojas (entrega só schema vazio + endpoint; popular dados é outra SPEC ou manual em dev)

## Implementação

**Stack:** Express 4 + TypeORM 0.3 + ioredis. Estrutura espelha o resto do backend (`controllers/services/repositories/routes/entities/migrations/subscribers/middleware/dtos/utils`), entregue pela SPEC-1505. Naming: `tb_<entity>` + colunas com prefixo `<entity>_<col>` (alinhado com `wynk_ecommerce/backend/` e CLAUDE.md do projeto).

**Tenant resolution:** sem header `x-tenant-id`. O `tenantId` corrente vem do `AsyncLocalStorage` populado pelo middleware da SPEC-1505 (resolve `host` HTTP → `tb_tenant` via `/tenant/resolve` cacheado em Redis). Acesso via helpers já existentes em `backend/src/middleware/tenant-context.ts` e `backend/src/utils/with-tenant.ts` — re-confirmar nomes exatos na implementação.

**Schema mínimo (TypeORM, entregue por ESTA SPEC):**

`tb_store`:
- `store_id` uuid PK (default `gen_random_uuid()`)
- `tenant_id` uuid NOT NULL — FK pra `tb_tenant.tenant_id`, com índice
- `store_name` varchar(120) NOT NULL
- `store_slug` varchar(140) NOT NULL — único por `(tenant_id, store_slug)`
- `store_logo_url` text NULL
- `store_cover_image_url` text NULL
- `store_floor` varchar(40) NULL
- `store_phone` varchar(40) NULL
- `store_is_restaurant` boolean NOT NULL default `false`
- `store_is_featured` boolean NOT NULL default `false`
- `store_status` varchar(20) NOT NULL default `'active'` — valores `'active' | 'inactive' | 'archived'` (validação no service, não enum DB pra permitir evolução sem migration)
- `store_sort_order` int NOT NULL default `0`
- `store_created_at` timestamptz NOT NULL default `now()`
- `store_updated_at` timestamptz NOT NULL default `now()`
- Índice: `(tenant_id, store_status, store_sort_order)` — listagem mais comum
- Índice trigram pra `store_name` (`pg_trgm` GIN) só se `pg_trgm` já estiver habilitado na base; caso contrário, deixa para SPEC futura (decisão registrada no state)

`tb_category`:
- `category_id` uuid PK (default `gen_random_uuid()`)
- `tenant_id` uuid NOT NULL — FK + índice
- `category_slug` varchar(140) NOT NULL — único por `(tenant_id, category_slug)`
- `category_name` varchar(120) NOT NULL
- `category_created_at` timestamptz NOT NULL default `now()`
- `category_updated_at` timestamptz NOT NULL default `now()`

`tb_store_category` (join):
- `store_id` uuid NOT NULL — FK `tb_store.store_id` ON DELETE CASCADE
- `category_id` uuid NOT NULL — FK `tb_category.category_id` ON DELETE CASCADE
- `tenant_id` uuid NOT NULL — redundante para defesa em profundidade
- PK composta `(store_id, category_id)`
- Índices: `(tenant_id, category_id)` (lookup por categoria) e `(tenant_id, store_id)` (lookup reverso)

**Schema dedicado:** todas as tabelas no schema `scp` (igual ao resto do backend conforme CLAUDE.md).

**Subscriber TypeORM:** as 3 entidades herdam o comportamento do `TenantSubscriber` existente (auto-preenche `tenant_id` em INSERT a partir do `AsyncLocalStorage`). Confirmar na implementação se há campo `tenant_id` em todas — sim, há.

**Chave de cache — listagem:**
`stores:list:{tenant_id}:cat={v}:feat={v}:l={v}:p={v}:q={v}:rest={v}` (params ordenados alfabeticamente; `search` normalizado para lowercase+trim antes de compor a chave).

**Invalidação:** SCAN cursor + DEL (nunca KEYS). Padrão: `stores:list:{tenant_id}:*`. **Nota:** sem CRUD admin nesta SPEC, a invalidação não tem caller ainda. Helper é entregue e exposto, e a SPEC futura de admin chamará `invalidateStoresCache(tenantId)` em insert/update/delete. Listagem com TTL 5 min cobre o gap até o admin existir.

**Fallback Redis:** se Redis cair, query no banco sem erro 500 (degradação graciosa). Mesmo padrão do `/tenant/resolve` da SPEC-1505 — vale checar se já há helper genérico de cache no backend antes de criar um novo.

**Tenant isolation:** toda query usa `withTenant(qb)` que injeta `WHERE tenant_id = $1` automaticamente. JOIN com `tb_category` via `tb_store_category` também filtra por `tenant_id` (defesa em profundidade — subscriber TypeORM garante em inserts, mas selects cruzados ainda exigem WHERE explícito).

**Arquivos planejados** (caminhos a confirmar com convenção real do backend):

Schema (novo, entregue por esta SPEC):
- `backend/src/entities/Store.ts`
- `backend/src/entities/Category.ts`
- `backend/src/entities/StoreCategory.ts`
- `backend/src/migrations/<timestamp>-CreateStoreTables.ts` (cria `tb_store`, `tb_category`, `tb_store_category` em ordem com FKs)

API + cache (novo):
- `backend/src/utils/cache.ts` ou `backend/src/services/cache.service.ts` (novo, ou reusar se já existir — inspecionar primeiro)
- `backend/src/controllers/store.controller.ts` — handler do `GET /api/v1/stores`
- `backend/src/services/store.service.ts` — orquestra cache + repository + montagem da resposta
- `backend/src/repositories/store.repository.ts` — query builder TypeORM com filtros
- `backend/src/routes/store.routes.ts` — registra `/api/v1/stores` no Express
- `backend/src/dtos/store-list.dto.ts` — tipos de request/response

Registro no app (modificado):
- `backend/src/app.ts` — montar `store.routes` em `/api/v1/stores`
- `backend/src/config/database.ts` — adicionar as 3 entidades à lista do DataSource

**Gotchas conhecidos:**
- Usar SCAN, nunca KEYS — bloqueia Redis em produção
- `Vary` obrigatório no header de host real visto pelo backend atrás do proxy — sem isso CDN serve dados de outro tenant. Confirmar nome exato (`x-forwarded-host`? `host`?) lendo o que o middleware da SPEC-1505 usa.
- Filtros DEVEM compor a cache key — cache hit com filtros errados retorna dados incorretos
- JOIN `tb_category` via `tb_store_category` deve incluir `tenant_id` — sem isso vaza categorias de outros tenants
- `limit > 50` é ajustado silenciosamente para 50, não erro 400
- `%` e `_` no `search` precisam ser escapados antes do ILIKE (regressão da implementação anterior: resolvido em `bf21c78` sobre código Drizzle, depois deletado — **re-entregar** sobre TypeORM)
- `search` precisa ser normalizado (lowercase + trim) ANTES de compor cache key e query (mesma situação)
- Migration deve criar `tb_store` ANTES de `tb_store_category` (FK)
- Sem `pg_trgm` instalado, a busca cai pra `ILIKE` linear — aceitável pra MVP, registrar como gotcha de performance futura
- Schema é mínimo deliberadamente: campos como horário, geo, avaliações virão em SPECs futuras. NÃO adicionar especulativamente.

## Critério de aceite

### Schema
- [x] Entidades TypeORM `Store`, `Category`, `StoreCategory` criadas em `backend/src/entities/` (2026-05-12 13:00)
- [x] Migration criada `1746748400000-CreateStoreTables.ts` com `tb_store`, `tb_category`, `tb_store_category` no schema `scp` (2026-05-12 13:00)
- [ ] Migration sobe e desce limpa: `npm run migration:run -w backend && npm run migration:revert -w backend` sem erro — **falta validar contra DB real antes do merge** (próximo passo registrado em `state.md`)
- [x] Entidades adicionadas ao DataSource em `backend/src/config/database.ts` (2026-05-12 13:05)
- [ ] Constraints únicas por tenant validadas: inserir 2 lojas com mesmo slug em tenants diferentes funciona; mesmo slug no mesmo tenant falha — **falta validar contra DB real** (cobertura unit do schema via revisão de migration, mas exige integration test)

### API
- [ ] `GET /api/v1/stores` retorna 200 com `{ data, total, page, limit }` — **falta E2E** (cobertura unit no service garante shape; rota montada em `app.ts`)
- [ ] Filtros `category` + `featured` + `is_restaurant` + `search` funcionam combinados — **falta E2E** (cobertura unit no DTO + repository query builder)
- [x] Paginação retorna metadata correta (`total` real via `getManyAndCount`, não da página) — cobertura unit em `store.service.test.ts` (response inclui `page`/`limit`/`total`) (2026-05-12 13:18)
- [x] Segunda chamada idêntica retorna `X-Cache: HIT` — cobertura unit em `store.service.test.ts` "cache HIT on second identical call" (2026-05-12 13:18)
- [x] Loja com `store_status != 'active'` não aparece na listagem — query builder em `store.repository.ts` aplica `andWhere('store.store_status = :status', { status: 'active' })` (2026-05-12 13:15)
- [x] `limit=100` é ajustado para 50 automaticamente — cobertura unit em `store-list.dto.test.ts` "clamps limit > 50" (2026-05-12 13:18)
- [x] Header `Cache-Control: public, max-age=300, s-maxage=300` presente — hardcoded em `store.controller.ts` (2026-05-12 13:15)
- [x] Header `Vary: X-Forwarded-Host` presente (confirmado: `app.set('trust proxy', true)` torna `req.hostname` reflexo de X-Forwarded-Host) (2026-05-12 13:15)
- [x] Redis fora do ar não causa 500 (fallback para DB) — `cached()` em `utils/cache.ts` faz catch + fallback; cobertura unit "falls back to repository when Redis GET fails" (2026-05-12 13:18)
- [x] Wildcards SQL (`%`, `_`, `\`) escapados no parâmetro `search` antes do ILIKE (re-entrega de `bf21c78` sobre TypeORM) — `escapeLikePattern` em `store.repository.ts`; cobertura unit em `store.repository.test.ts` (2026-05-12 13:18)
- [x] `search` normalizado (lowercase + trim) antes de compor cache key — `parseSearch` em `store-list.dto.ts`; cobertura unit em `store-list.dto.test.ts` (2026-05-12 13:18)
- [x] Implementação usa as entidades TypeORM entregues nesta SPEC — `StoreRepository` injeta `getRepository(Store)` e faz JOIN com `StoreCategory`/`Category` (2026-05-12 13:15)
- [x] Tenant resolvido via `AsyncLocalStorage` + `withTenant(qb)` (SPEC-1505), sem header `x-tenant-id` — `StoreRepository.findActiveListing` chama `withTenant(qb)` + `requireTenantContext()` para JOINs (2026-05-12 13:15)
- [x] Helper `invalidateStoresCache(tenantId)` exportado (sem caller nesta SPEC) — `StoreService.invalidateListings` chama `invalidateByPattern('stores:list:{tenantId}:*')`; cobertura unit (2026-05-12 13:18)

### Testes
- [x] Testes mínimos cobrindo: isolamento por tenant (cache keys com `tenant_id`; helper `withTenant` herdado da SPEC-1505 já testado em `cross-tenant-isolation.test.ts`), fallback Redis, cache HIT/MISS, escape `%`/`_`/`\`, paginação, clamp de `limit`, normalize de `search`, TTL 300s, invalidação SCAN+DEL — 21 testes unit em 3 suites (`store-list.dto.test.ts`, `store.repository.test.ts`, `store.service.test.ts`); 71 testes totais passando (2026-05-12 13:22)
- [ ] **E2E ainda pendente:** rota `/api/v1/stores` exercitada com DB + Redis reais via testcontainers ou docker-compose. Registrado como próximo passo em `state.md` antes de arquivar a SPEC.

### Processo
- [ ] **Features tocadas (stores-public-api) atualizadas** com timestamp e referência a esta SPEC — pendente até arquivar (R.7 aplica no momento de mover para `archive/`)
- [ ] `state.md` com entrada `[conclusão]` — pendente até concluir todos os critérios
- [ ] `memory.md` com TL;DR final atualizado — pendente até concluir
- [x] Destino da SPEC-20260503-1506-modulo-lojas decidido (2026-05-12 12:42 — **descartada**, movida para `docs/discard/`, justificativa formal registrada no `main.md` dela)
