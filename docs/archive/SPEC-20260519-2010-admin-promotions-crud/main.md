# SPEC-20260519-2010: API Admin CRUD de Promoções

**Status:** done
**Criada:** 2026-05-19 20:10
**Ativada:** 2026-05-19 20:10
**Concluida:** 2026-05-25 09:30
**Commit final:** _(commit pendente)_
**Keywords:** promotions, admin-api, crud, multitenant, isolamento, expiracao-natural, store-fk
**Features:** promotions-admin, admin-stores-crud, tenant-resolution, auth, infra-base
**Branch:** feature/SQU-52-api-admin-crud-de-promocoes
**Depende de:** SPEC-20260516-1430 (admin-stores-crud)
**Origem:** dev em 2026-05-19 (esta SPEC é a versão SPEC-driven v2 do arquivo informal `docs/SPEC-SQU-52-admin-crud-promocoes.md`, criada retrospectivamente em 2026-05-25 após merge de main pra alinhar a branch ao processo)
**Resumo:** CRUD admin de promoções vinculadas a loja com expiração natural (sem cron — filtro de query), validação cross-tenant rigorosa, cache invalidation acoplada às listagens de stores e isolamento multitenant em 3 camadas (`withTenant`, `TenantSubscriber`, validação de `store_id`).

## Objetivo

Entregar gestão admin de promoções: cada loja pode ter N promoções com `valid_from`/`valid_until`, geração de tráfego importante na detalhe da loja. Expiração é natural via query (sem cron) — diferente de Event/Theater que precisam de scheduler. Isolamento crítico pra garantir que tenant A não vincule promoção a loja de tenant B.

## Escopo

**DENTRO:**
- Entidade TypeORM `Promotion` (FK obrigatória para `Store` + `Tenant`, schema `tb_promotion`)
- Endpoints admin completos:
  - `GET /api/admin/promotions` (lista paginada, filtros `status`, `store_id`, `expired`)
  - `POST /api/admin/promotions` (cria draft)
  - `GET /api/admin/promotions/:id` (detalhe)
  - `PUT /api/admin/promotions/:id` (atualiza, campos opcionais)
  - `DELETE /api/admin/promotions/:id` (só draft/archived, 409 se published)
  - `POST /api/admin/promotions/:id/publish` (draft → published, seta `published_at`)
  - `POST /api/admin/promotions/:id/archive` (qualquer → archived)
- Validação:
  - `store_id` deve existir no tenant atual → caso contrário 422 `store_not_found`
  - `valid_until > valid_from` (estrita) → 400
  - `valid_from`/`valid_until` ISO 8601 com timezone, até 2 anos no futuro
  - `title` ≤200, `discount_label` ≤50, `slug` ≤250 (gerado automático se omitido)
  - Slug único por tenant → 409 `slug_conflict`
- Isolamento multitenant em 3 camadas: query (`withTenant`), entity (`TenantSubscriber`), business (`storeExistsForCurrentTenant`)
- Cache invalidation: `promotions:detail:{tid}:*`, `promotions:list:{tid}:*`, `stores:detail:{tid}:{sid}:*`, `stores:list:{tid}:*`
- Filtro `?expired=true|false` para admin ver histórico (expirado = `valid_until < now()`)
- Migration `1746748500000-CreatePromotionTable.ts` com unique `(tenant_id, slug)` e indexes operacionais
- Mock controller em `__tests__/helpers/mock-deps.ts` (`makeStubPromotionController`) e stub em `tests/helpers/setup.ts` para test:isolation

**FORA:**
- Cron job de publicação automática (expiração é por query, e publicação é manual via endpoint)
- Endpoint público de listagem (Fase posterior)
- UI do backoffice (Fase posterior)
- Sanitização HTML de `description` (apenas trim — diferente da SPEC-20260518-1625 que aplica sanitize-html em body/synopsis; aqui a decisão foi não-bloqueante pra MVP)
- Reordenação manual de promoções na listagem
- Integração com Sympla/sistema externo

## Implementação

### Arquitetura

1. **Entidade** (`backend/src/entities/Promotion.ts`)
   - Tabela `tb_promotion`, colunas com prefixo `promotion_`
   - FK `tenant_id` → `tb_tenant` ON DELETE CASCADE
   - FK `store_id` → `tb_store` ON DELETE CASCADE
   - Unique `(tenant_id, promotion_slug)`
   - Index `(tenant_id, store_id)`, `(tenant_id, status, published_at)`, `(tenant_id, valid_until)`

2. **DTO/Validators** (`backend/src/dtos/promotion.dto.ts`)
   - Parser/validador manual (sem Zod, alinhado com decisão de SPEC-20260518-1625)
   - Validações campo-a-campo retornando array de erros (`{field, message}`)

3. **Repository** (`backend/src/repositories/promotion.repository.ts`)
   - `withTenant()` em todas as queries (defense in depth com `TenantSubscriber`)
   - `storeExistsForCurrentTenant(storeId)` — gate para garantir que `store_id` pertence ao tenant atual
   - `listForCurrentTenant(query)` — LEFT JOIN com `tb_store` e retorno em raw+entities para incluir `store: {id, name, slug}`
   - `listActiveForStore(storeId)` — usado pelo módulo público (futuro) com `status=published` AND `valid_from <= now()` AND `valid_until >= now()`

4. **Service** (`backend/src/services/promotion.service.ts`)
   - Validações de negócio (datas, slug conflict, store existence)
   - Erros tipados: `PromotionNotFoundError`, `StoreNotFoundError`, `SlugConflictError`, `CannotDeleteError`
   - Try/catch específico para violação de unique constraint (`uq_tb_promotion_tenant_slug`) → traduz em `SlugConflictError`
   - Invalidação de cache em todas as mutações (4 patterns: promotions list/detail + stores list/detail)

5. **Controller** (`backend/src/controllers/promotion.controller.ts`)
   - Mapeia HTTP → service, traduz erros em status codes
   - 7 handlers: list, getById, create, update, delete, publish, archive

6. **Rotas** (`backend/src/routes/promotion.routes.ts`)
   - Todas protegidas por `requireAuth`
   - Integrado em `backend/src/app.ts` (não-opcional em `AppDeps`)

### HTTP Status Codes

- **201**: POST com sucesso
- **200**: GET, PUT, publish, archive com sucesso
- **204**: DELETE com sucesso
- **400**: validação falhou (lista campo-a-campo)
- **401**: sem JWT
- **404**: recurso não existe (ou cross-tenant)
- **409**: slug conflict OU delete em status `published`
- **422**: `store_id` inválido (não existe no tenant atual)

### Decisão: expiração natural vs cron

Eventos e theater shows usam cron para mudar `status=scheduled → published` quando `published_at <= now()` (SPEC-20260518-1625). Promoções **não precisam de cron** porque:
- Não têm conceito de "scheduled" — vão pra `published` por chamada explícita do endpoint
- "Expiração" é apenas filtro de query (`valid_until < now()`), sem mudança de estado no DB
- Custo operacional zero: nada roda no background, basta o consumer ler com o filtro certo

Trade-off: o status `published` permanece após expiração — quem consome precisa filtrar por `valid_until`. Documentado na feature `promotions-admin` e refletido nas pseudo-queries de uso público.

## Critério de aceite

- [x] Entidade `Promotion` criada com FK para `Store`/`Tenant` e indexes (2026-05-19 20:10, commit `b1d13dc`)
- [x] Migration `1746748500000-CreatePromotionTable.ts` aplicada (2026-05-19 20:10, commit `b1d13dc`)
- [x] DTO/validators manuais em `dtos/promotion.dto.ts` (2026-05-19 20:10, commit `b1d13dc`)
- [x] `GET /api/admin/promotions` lista paginada com filtros `status`, `store_id`, `expired` (2026-05-19 20:10, commit `b1d13dc`)
- [x] `POST /api/admin/promotions` cria draft com validação cross-tenant de `store_id` → 422 (2026-05-19 20:10, commit `b1d13dc`)
- [x] `GET /api/admin/promotions/:id` retorna detalhe (2026-05-19 20:10, commit `b1d13dc`)
- [x] `PUT /api/admin/promotions/:id` atualiza com campos opcionais (2026-05-19 20:10, commit `b1d13dc`)
- [x] `DELETE /api/admin/promotions/:id` remove só draft/archived → 409 se published (2026-05-19 20:10, commit `b1d13dc`)
- [x] `POST /api/admin/promotions/:id/publish` muda status e seta `published_at` (2026-05-19 20:10, commit `b1d13dc`)
- [x] `POST /api/admin/promotions/:id/archive` muda status para `archived` (2026-05-19 20:10, commit `b1d13dc`)
- [x] Validação `valid_until > valid_from` (estrita) → 400 (2026-05-19 20:10, commit `b1d13dc`)
- [x] Slug gerado automaticamente de `title` se omitido (2026-05-19 20:10, commit `b1d13dc`)
- [x] Slug único por tenant → 409 (unique `(tenant_id, promotion_slug)`) (2026-05-19 20:10, commit `b1d13dc`)
- [x] Cache invalidation cobre promotions + stores (4 patterns) (2026-05-19 20:10, commit `b1d13dc`)
- [x] Listagem inclui `store: {id, name, slug}` via LEFT JOIN com `tb_store` (2026-05-19 20:10, commit `b1d13dc`)
- [x] Filtro `?expired=true|false` opera sobre `valid_until` (2026-05-19 20:10, commit `b1d13dc`)
- [x] Isolamento multitenant em 3 camadas (`withTenant` + `TenantSubscriber` + `storeExistsForCurrentTenant`) (2026-05-19 20:10, commit `b1d13dc`)
- [x] Mock controller (`makeStubPromotionController`) em `backend/__tests__/helpers/mock-deps.ts` (2026-05-19 20:10, commit `b1d13dc`)
- [x] Stub `promotionController` em `tests/helpers/setup.ts` (test:isolation pós-merge) (2026-05-25 09:20, commit pendente)
- [x] Lint errors zerados: `SelectQueryBuilder` e `CACHE_TTL_SECONDS` unused removidos (2026-05-25 09:15, commit pendente)
- [x] Conflito de merge `main` em `backend/src/config/database.ts` resolvido (bloco `BACKEND_SRC` deduplicado, `Promotion` mantida no array) (2026-05-25 09:10, commit pendente)
- [x] **Features tocadas (promotions-admin, admin-stores-crud, tenant-resolution, auth, infra-base) atualizadas** com timestamp e referência a esta SPEC (2026-05-25 09:30, commit pendente)
- [x] `state.md` com entrada `[conclusão]` (2026-05-25 09:30, commit pendente)
- [x] `memory.md` com TL;DR final atualizado (2026-05-25 09:30, commit pendente)
