# Feature: admin-stores-crud

**Keywords:** stores, admin, crud, multitenant, sanitization, categories, reorder, upload-stub
**Arquivos principais:**
  - backend/src/controllers/store.controller.ts
  - backend/src/services/store.service.ts
  - backend/src/repositories/store.repository.ts
  - backend/src/controllers/store-category.controller.ts
  - backend/src/services/store-category.service.ts
  - backend/src/repositories/store-category.repository.ts
  - backend/src/routes/store.routes.ts
  - backoffice/src/App.tsx
**Resumo:** Superficie administrativa do catalogo de lojas. Inclui CRUD de lojas, CRUD de categorias com reordenacao, validacao multitenant e um backoffice minimo funcional para operar o modulo.

## Specs desta feature

### Concluidas
| ID | Data | Commit | Titulo |
|---|---|---|---|
| SPEC-20260516-1430 | 2026-05-18 | `7642216` | CRUD completo de lojas no admin |
| SPEC-20260516-1730 | 2026-05-18 | `8aef2da` | Catalogo de lojas - fase 2 publica e operacional |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| SPEC-??? | Upload real para CDN | Substituir stub `/uploads/...` por persistencia real |
| SPEC-??? | ACL editor vs admin | Separar permissoes de criacao/publicacao |

### Em execucao (so em branches - nao aparece em main)
| ID | Titulo | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

A feature nasceu na SPEC-20260516-1430 com o CRUD base de lojas. Desde 2026-05-16 17:30, a SPEC-20260516-1730 amplia essa superficie com:
- categorias admin com `sort_order` e endpoint de reorder
- upload stub por metadata no CRUD de lojas
- backoffice minimo para operar lojas e categorias

Dependencias:
- `withTenant()` e `AsyncLocalStorage` da feature `tenant-resolution`
- schema base de `tb_store`, `tb_category` e `tb_store_category`
- auth por cookie com `requireAuth`

## Decisões arquiteturais ativas

- **Validação Zod centralizada em `lib/validators.ts`** (origem: SPEC-20260516-1430, 2026-05-16) — schemas com mensagens campo-a-campo + helper `validateWithSchema` mapeando erros pra `Record<string,string>`. Aplicado em create/update + endpoint de reorder de categorias.
- **Sanitização HTML server-side via `sanitize-html`** (origem: SPEC-20260516-1430, 2026-05-16) — allowlist conservadora (`p, br, strong, em, u, h2-h4, ul, ol, li, a, img, blockquote`) + schemes `http/https/mailto`. Aplicado em `description` antes de gravar; portal renderiza HTML sanitizado.
- **Slug auto-gerado quando omitido + uniqueness por tenant** (origem: SPEC-20260516-1430, 2026-05-16) — `slugifyStoreName(name)` (NFKD + lower + dash) na ausência de slug; regex `^[a-z0-9-]+$` quando fornecido; conflict detection via `StoreSlugConflictError` (409).
- **RBAC com `requireTenantAdmin` middleware** (origem: SPEC-20260516-1430, 2026-05-16) — checa `req.user.role ∈ {tenant_admin, admin}` em rotas admin; tenant context vem do JWT (não do header), evitando cross-check redundante.
- **Transação em mutações de relações N:M (store ↔ categorias)** (origem: SPEC-20260516-1430, 2026-05-16) — POST e PUT com `category_ids` rodam em `DataSource.transaction()`. PUT sem `category_ids` no body não toca em relações; com `category_ids` faz DELETE all + INSERT new dentro da transação.
- **Upload é stub por metadata, não multipart** (origem: SPEC-20260516-1730, 2026-05-16) — admin envia `{file_name, mime_type, size}` em `logo_upload`/`cover_upload`; backend gera URL fake `/uploads/{tenant_id}/stores/{slug}/{filename}`. Upload real para CDN fica na Fase 6 (SPEC futura).
- **Categorias de outro tenant em payload retornam 422 (não 404)** (origem: SPEC-20260514-2012, validado em testes) — `InvalidStoreCategoriesError` é semanticamente "input inválido"; 404 é reservado pro recurso principal não existir.
