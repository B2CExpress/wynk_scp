# State — SPEC-20260516-1430-admin-stores-crud

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-16 14:30

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-16 14:30
**Onde tô:** Fase 0 — plano + leitura de contexto
**Próximo passo:** Criar validators Zod + sanitize lib, depois repository methods
**Última decisão:** Transação em POST/PUT para atualizar relações de categorias atomicamente
**Bloqueio atual:** nenhum
**Se retomar, ler:** Entradas a partir de [ativação]

---

## Status snapshot

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Validators (Zod) + sanitize + storage stub | pendente | 2026-05-16 14:30 | — |
| 2 | Expand repository + service | pendente | 2026-05-16 14:30 | — |
| 3 | Controllers GET+POST+PUT+DELETE | pendente | 2026-05-16 14:30 | — |
| 4 | Testes manuais (6 casos) | pendente | 2026-05-16 14:30 | — |
| 5 | Feature + memory final | pendente | 2026-05-16 14:30 | — |

### Próximos passos

- [ ] Ler schema Store entity existente e validar relações
- [ ] Criar Zod schema para POST/PUT payload
- [ ] Implementar sanitizeHtml wrapper com allowlist
- [ ] Stub upload storage
- [ ] Expandir StoreRepository com métodos de transação

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-16 14:30] SPEC-20260506-1400 entregou schema base (`tb_store`, `tb_category`, `tb_store_category`) + listagem pública. Fonte: `docs/features/stores-public-api.md`.
- [2026-05-16 14:30] SPEC-20260514-2012 abriu minimamente admin com POST + PUT + GET /:slug. Fonte: `docs/active/SPEC-20260514-2012-stores-tenant-isolation/main.md`.
- [2026-05-16 14:30] Isolamento via `withTenant()` helper já implementado no backend. Tenant via `getTenantId()` middleware Express. Fonte: `docs/CLAUDE.md` (stack section).
- [2026-05-16 14:30] Cache invalidation helper `invalidateStoresCache(tenantId)` entregue por SPEC-1400, exportado mas ainda sem caller. Fonte: `docs/features/stores-public-api.md` estado atual.

## Inferências prováveis

- [2026-05-16 14:30] StoreRepository pode ser expandido das rotas SPEC-1400 ou criar novo. Se isolado, precisa ter estrutura consistente com wynk_ecommerce backend. Validar com: ler `backend/src/repositories/` no projeto.
- [2026-05-16 14:30] Transação em TypeORM pode usar `DataSource.transaction()` ou `QueryRunner`. Comum em wynk_ecommerce? Validar com: grep por `transaction` nos sources.

## Dúvidas em aberto

_(nenhuma, backlog foi detalhado pelo usuário)_

---

## Log cronológico (APPEND-ONLY)

## 2026-05-16 14:30 — [ativação]

Plano inicial: criar SPEC nova SQU-42 para CRUD admin completo de lojas (POST, GET, GET/:id, PUT, DELETE) com sanitização HTML, validação Zod, categorias em transação.

Depende de SPEC-20260514-2012 (isolação + rotas abertas minimamente).

Features tocadas: nova `admin-stores-crud`, + contexto de `stores-public-api` e `tenant-resolution`.

Arquivos identificados relevantes:
- Entidades: `backend/src/entities/Store.ts`, `Category.ts`, `StoreCategory.ts` (existem, SPEC-1400)
- Repository (placeholder): `backend/src/repositories/` (expandir)
- Service (placeholder): `backend/src/services/store.service.ts` (expandir)
- Controllers: `app/api/admin/stores/route.ts` (GET+POST), `app/api/admin/stores/[id]/route.ts` (GET+PUT+DELETE)
- Validators: `lib/validators/store.ts` (criar)
- Sanitize: `lib/sanitize.ts` (criar)
- Storage: `lib/storage/upload.ts` (criar stub)

## 2026-05-18 — [MARCO] [conclusão]

SPEC concluída e arquivada após resolução do conflito com main e validação no CI.

**Contexto da retomada:** sessão #1 (2026-05-16 14:30, Leonardo) entregou o código no commit `145f0cd` mas não atualizou `state.md`/`memory.md` durante a implementação — esses arquivos refletem só a fase inicial de ativação. Sessão #2 (2026-05-18) pegou a branch em DRAFT/dirty após o merge do PR #13 e levou ao verde no CI.

**O que foi entregue (commit `145f0cd` de 2026-05-16):**
- 5 endpoints admin: `GET /api/admin/stores`, `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id`.
- Validação Zod em `lib/validators.ts` com `StoreAdminInputSchema` e `CreateStoreSchema`.
- Sanitização HTML em `lib/sanitize.ts` (allowlist `sanitize-html`: p, br, strong, em, u, h2-h4, ul/ol/li, a, img, blockquote + schemes http/https/mailto).
- Slug generator em `lib/slug.ts` com NFKD normalize + regex `^[a-z0-9-]+$`.
- Storage stub em `lib/storage.ts` (URL fake `/uploads/{tenant_id}/stores/{slug}/{filename}`) — **dívida técnica registrada**: upload real para CDN entra na Fase 6.
- Middleware `requireTenantAdmin` (RBAC role check).
- Errors específicos: `StoreValidationError` (400), `StoreSlugConflictError` (409), `InvalidStoreCategoriesError` (422), `StoreNotFoundError` (404).
- Migration `1746748500000-AddStoreExternalUrlAndOpeningHours.ts` adicionando `store_external_url` e `store_opening_hours`.
- Cache de listagem invalidado em todas as mutações via `invalidateListings(tenantId)`.
- 4 testes Jest em `store-admin.service.test.ts` cobrindo create/update/delete e validation.

**Caminho da sessão #2 (arquivamento, 2026-05-18):**

1. **`1dbdca5`** — Merge de `main` na branch. Resolveu 2 conflitos:
   - `docs/features/stores-public-api.md`: removeu linhas obsoletas (SPEC-1400 e SPEC-2012 já arquivadas em main pelo PR #16 e PR #13), manteve só SPEC-1430.
   - `backend/src/controllers/store.controller.ts`: linter quebrou o import durante o conflito; restaurada a versão completa do commit `145f0cd` que tem 5 métodos admin (`listAdmin`, `getDetailAdmin`, `createAdmin`, `updateAdmin`, `deleteAdmin`).
   - Auto-merge issues:
     - `Store.ts` ficou com `description` duplicado (PR #9 fulltext já adicionou na main, #14 também adicionou). Removida a duplicação extra.
     - `store.repository.ts:277` chamava `escapeLikePattern` que o PR #9 removeu. Inlineado o escape de wildcards no `listAdminWithFilters` (mantém ILIKE simples na busca admin; a busca pública usa fulltext via tsvector).
   - `npm install` na raiz pra trazer `sanitize-html` e demais deps do `package-lock.json` atualizado.
2. **`7642216`** — Fix da migration:
   - Classe `AddStoreFieldsDescription1746748500` tinha timestamp de 10 dígitos. TypeORM exige timestamp JS (ms, 13 dígitos). Corrigida pra `AddStoreExternalUrlAndOpeningHours1746748500000`.
   - Removida a coluna `store_description` da migration — já é criada pela `1746748400000-CreateStoreTables` (o PR #9 fulltext absorveu a coluna lá ao expandir o CREATE TABLE com `store_search_vector`).
   - Arquivo renomeado de `AddStoreFieldsDescription` pra `AddStoreExternalUrlAndOpeningHours` (reflete conteúdo real).

**Resultado no CI (commit `7642216`):**

```
✓ format check
✓ portal/backoffice/backend (typecheck/lint/test)
✓ validate flavor manifest
✓ isolation tests       ← 8 cenários verdes (cobrem GET/PUT cross-tenant + 422 categoria + cache Redis isolado por tenant)
```

12/12 checks verdes. `mergeable_state: clean`.

**Dependências da SPEC:**
- Depende de SPEC-20260514-2012 (já arquivada em main): forneceu o CRUD admin **mínimo** + a suite de isolamento que valida os endpoints completos desta SPEC.
- A própria suite test:isolation funciona como teste de aceitação ponta-a-ponta dos endpoints admin: cenários 2 (404 slug), 6 (404 PUT cross-tenant), 7 (422 categoria cross-tenant) cobrem invariantes desta SPEC.

**R.7 (features atualizadas):**
- `docs/features/admin-stores-crud.md` — linha em "Concluídas" + "Em execução" zerada (2026-05-18).
- `docs/features/stores-public-api.md` — linha em "Concluídas" + "Em execução" zerada (2026-05-18).
- `docs/features/tenant-resolution.md` — linha em "Concluídas" (2026-05-18).

**Dívida técnica registrada:** `lib/storage.ts` continua stub. Upload real para CDN cabe à Fase 6 — abrir SPEC nova quando entrar no roadmap.

**PR stacked acima:** o PR #15 (`feature/SQU-39-fase-2-modulo-de-lojas`) tem categorias CRUD + portal pages baseados nesta branch. Após o merge deste PR, o #15 fica re-targetável pra `main` e o GitHub vai mostrar só o commit incremental (`53d2b28`) — vai precisar de rebase contra a nova main (provavelmente com conflitos similares aos resolvidos aqui).

Commit do arquivamento: este commit.
