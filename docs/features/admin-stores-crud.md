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
| _(nenhuma ainda)_ | — | — | — |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| SPEC-??? | Upload real para CDN | Substituir stub `/uploads/...` por persistencia real |
| SPEC-??? | ACL editor vs admin | Separar permissoes de criacao/publicacao |

### Em execucao (so em branches - nao aparece em main)
| ID | Titulo | Branch |
|---|---|---|
| SPEC-20260516-1430 | CRUD completo de lojas no admin | feature/SQU-42-api-admin-crud-de-lojas |
| SPEC-20260516-1730 | Catalogo de lojas - fase 2 publica e operacional | feature/store-catalog-phase-2 |

## Estado atual

A feature nasceu na SPEC-20260516-1430 com o CRUD base de lojas. Desde 2026-05-16 17:30, a SPEC-20260516-1730 amplia essa superficie com:
- categorias admin com `sort_order` e endpoint de reorder
- upload stub por metadata no CRUD de lojas
- backoffice minimo para operar lojas e categorias

Dependencias:
- `withTenant()` e `AsyncLocalStorage` da feature `tenant-resolution`
- schema base de `tb_store`, `tb_category` e `tb_store_category`
- auth por cookie com `requireAuth`
