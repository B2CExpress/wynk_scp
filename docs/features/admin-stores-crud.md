# Feature: admin-stores-crud

**Keywords:** stores, admin, crud, multitenant, isolamento, sanitization, paginacao, categorias, transacao
**Arquivos principais:**
  - backend/src/controllers/admin-stores.controller.ts
  - backend/src/services/admin-stores.service.ts
  - backend/src/repositories/store.repository.ts (expandido)
  - app/api/admin/stores/route.ts
  - app/api/admin/stores/[id]/route.ts
  - lib/validators/store.ts
  - lib/sanitize.ts
  - lib/storage/upload.ts
**Resumo:** CRUD completo de lojas no painel de gestão do admin (POST, GET listagem, GET detalhe, PUT, DELETE) com isolamento multitenant, validação robusta, sanitização HTML, relação N:M com categorias via transação, slug auto-gerado, cache invalidation pós-mutação.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| _(nenhuma ainda)_ | — | — | — |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| SPEC-??? | Upload real para CDN | Fase 6 — substituir stub /uploads por upload real |
| SPEC-??? | Backoffice UI — Stores | React components + formulário para gerenciar stores |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260516-1430 | CRUD completo de lojas no admin | feature/SQU-42-api-admin-crud-de-lojas |

## Estado atual

Feature iniciada na SPEC-20260516-1430. Herda schema (`tb_store`, `tb_category`, `tb_store_category`) da SPEC-20260506-1400 (stores public API). Admin routes abertas minimamente pela SPEC-20260514-2012 (isolamento); esta SPEC entrega CRUD completo, validação robusta, sanitização HTML, transações em mutações de relações, paginação com filtros.

Dependências:
- `withTenant()` helper (SPEC-20260503-1505)
- `getTenantId()` middleware Express (SPEC-20260503-1505)
- `invalidateStoresCache(tenantId)` helper (SPEC-20260506-1400)
- Schema base stores/categories (SPEC-20260506-1400)
- Auth + role checking (infra-base)

> Última atualização: 2026-05-16 14:30 (SPEC-20260516-1430, ativação)

## Decisões arquiteturais ativas

_(serão preenchidas durante execução)_

## Alternativas consideradas e rejeitadas

_(serão preenchidas durante execução)_

## Gotchas

_(serão preenchidas durante execução)_

## Estado congelado (se houver)

_(nenhum)_
