# SPEC-20260516-1430: CRUD completo de lojas no admin

**Status:** active
**Criada:** 2026-05-16 14:30
**Ativada:** 2026-05-16 14:30
**Concluída:** —
**Commit final:** —
**Keywords:** stores, admin, crud, sanitization, html, paginacao, upload-stub, isolamento-tenant
**Features:** admin-stores-crud, stores-public-api, tenant-resolution
**Branch:** feature/SQU-42-api-admin-crud-de-lojas
**Depende de:** SPEC-20260514-2012
**Origem:** usuário em 2026-05-16 14:30
**Resumo:** Implementar CRUD completo de lojas no painel admin (POST, GET, GET/:id, PUT, DELETE) com sanitização HTML, validação robusta de payload, atualização de relações de categorias via tabela de junção, slug auto-gerado, e testes de isolamento multitenant.

## Objetivo

Lugar onde admin do tenant passa mais tempo. Endpoints admin expõem full CRUD com:
- Criação/atualização com múltiplas imagens (logo, cover) e categorias (relação N:M)
- Campos de destaque (featured) e tipo (restaurante)
- Descrição em HTML sanitizada contra XSS
- Slug auto-gerado se não fornecido, com unicidade por tenant
- Validação rigorosa (Zod), paginação, filtros (status, featured, search)
- Transações ao modificar relações de categorias (DEL todas + INS novas)

## Escopo

**DENTRO:**
- 5 endpoints: GET (listagem) | GET /:id (detalhe) | POST (criar) | PUT /:id (atualizar) | DELETE /:id
- Request/response DTOs e schemas Zod com validação campo-a-campo
- Sanitização HTML via `sanitize-html` (allowlist: p, br, strong, em, u, h2-h4, ul/ol/li, a, img, blockquote)
- Slug: regex `^[a-z0-9-]+$`, auto-gerar de `name` com `slugify` se omitido, validar uniqueness por tenant
- Categorias: array de UUIDs, validar ownership (todas devem pertencer ao tenant), transação na atualização
- Upload stub: `lib/storage/upload.ts` → fake URL `/uploads/{tenant_id}/stores/{slug}/{filename}`
- Paginação: `page` (default 1) + `limit` (default 20, max 100)
- Filtros: `status` (active|inactive), `featured` (boolean), `search` (LIKE em name)
- Isolamento: `withTenant()` em todas as queries, bloquear cross-tenant em GET/:id, PUT/:id, DELETE/:id (404)
- Transações ACID ao criar/atualizar (rollback se falhar no meio, ex.: categoria inexistente após já ter inserido loja)
- Erros: 400 (validação), 401 (sem auth), 403 (sem role admin), 404 (outro tenant ou inexistente), 409 (slug dup), 422 (categoria inválida)

**FORA:**
- Upload real para CDN (Fase 6)
- Backoffice UI (React components)
- Testes de frontend
- Busca full-text Postgres (tsvector/GIN)
- Rate limiting por endpoint
- Webhooks de auditoria

## Implementação

Arquivos a criar/modificar:

1. **Validators** (`lib/validators/store.ts`) — Zod schemas para request body com erros campo-a-campo
2. **Sanitização** (`lib/sanitize.ts`) — wrapper `sanitizeHtml(input)` com allowlist configurada
3. **Storage stub** (`lib/storage/upload.ts`) — função `uploadStoreImage(file, tenant, slug)` → URL fake
4. **Entidades** — Store entity já entregue por SPEC-1400; validar relação JOINs com categorias
5. **Repository** — expandir `StoreRepository` (ou criar novo) com métodos:
   - `listByTenant(tenantId, filters, pagination)` → JOIN com StoreCategory + Category
   - `findByIdAndTenant(id, tenantId)` → 404 se outro tenant
   - `findBySlugAndTenant(slug, tenantId)` → para validar unicidade
   - `createWithCategories(store, categoryIds, tenantId)` — TRANSAÇÃO
   - `updateWithCategories(id, store, categoryIds, tenantId)` — TRANSAÇÃO (DEL + INS)
   - `deleteByIdAndTenant(id, tenantId)` → cascade automático via DB (FK on delete cascade)
6. **Service** — lógica de business:
   - Validar payload (Zod)
   - Auto-gerar slug se vazio
   - Sanitizar HTML
   - Validar categorias pertencem ao tenant
   - Chamar repo com TRANSAÇÃO
7. **Controller** (`app/api/admin/stores/route.ts` GET+POST, `app/api/admin/stores/[id]/route.ts` GET+PUT+DELETE)
   - Auth + role check (admin)
   - Tenant via `getTenantId()` (Express middleware)
   - Request → service → response com status HTTP correto

Transação em POST/PUT:
```
BEGIN
  INSERT stores (sem categoria)
  PARA CADA category_id: INSERT store_category_relations
COMMIT/ROLLBACK
```

UPDATE categorias sem mexer em outros campos:
```
BEGIN
  DELETE store_category_relations WHERE store_id = id
  PARA CADA novo category_id: INSERT store_category_relations
COMMIT/ROLLBACK
```

Response da listagem (paginada):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Renner",
      "slug": "renner",
      "logo_url": "https://...",
      "floor": "L1",
      "is_featured": true,
      "categories": [{"id": "uuid", "name": "Roupas"}],
      "status": "active"
    }
  ],
  "total": 47,
  "page": 1,
  "limit": 20
}
```

Validação de payload (400 com lista de erros campo-a-campo):
```
name: string min 2 max 200, obrigatório em POST
slug: regex ^[a-z0-9-]+$ max 200, opcional, auto-gerar se vazio
description: string max 10000, opcional, sanitizado antes de salvar
logo_url, cover_image_url, external_url: URL válida, opcionais
floor: string max 50, opcional
phone: string max 20, opcional
opening_hours: objeto JSON livre, opcional
is_featured, is_restaurant: boolean, default false
category_ids: array UUID, default [], VALIDAR ownership
```

Invalidação de cache após mutação: chamar `invalidateStoresCache(tenantId)` após POST/PUT/DELETE (entregue por SPEC-1400).

## Critério de aceite

- [ ] Endpoint GET /api/admin/stores com paginação, filtros e isolamento ✓
- [ ] Endpoint GET /api/admin/stores/:id com 404 cross-tenant ✓
- [ ] Endpoint POST /api/admin/stores com validação, sanitização, slug auto-gerado ✓
- [ ] Endpoint PUT /api/admin/stores/:id com atualização de categorias (transação) ✓
- [ ] Endpoint DELETE /api/admin/stores/:id com cascade ✓
- [ ] Validação categoria cross-tenant retorna 422 ✓
- [ ] HTML perigoso (<script>) removido em description ✓
- [ ] Slug com caracteres inválidos rejeitado, auto-gerado de name ✓
- [ ] `lib/validators/store.ts` com Zod schemas ✓
- [ ] `lib/sanitize.ts` com allowlist HTML ✓
- [ ] `lib/storage/upload.ts` stub funcional ✓
- [ ] Testes manuais: 6 casos (sem categorias, com 2 categorias, cross-tenant 422, HTML sanitizado, paginação, PUT com update de categorias) ✓
- [ ] Cache Redis invalidado após mutação ✓
- [ ] Isolamento testado (GET/PUT/DELETE de outro tenant = 404) ✓
- [ ] **Features tocadas (admin-stores-crud, stores-public-api, tenant-resolution) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
