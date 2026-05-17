# Feature: stores-public-api

**Keywords:** stores, public-api, redis, cache, listagem, detalhe, filtros, full-text, tenant-isolation
**Arquivos principais:**
  - backend/src/controllers/store.controller.ts
  - backend/src/services/store.service.ts
  - backend/src/repositories/store.repository.ts
  - backend/src/routes/store.routes.ts
  - backend/src/utils/cache.ts
  - portal/src/lib/stores/api.ts
**Resumo:** API publica do catalogo de lojas por tenant. Exponibiliza listagem, detalhe, categorias para filtro e cache Redis em listagens, com isolamento estrito por tenant e busca textual.

## Specs desta feature

### Concluidas
| ID | Data | Commit | Titulo |
|---|---|---|---|
| _(nenhuma ainda)_ | — | — | — |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| SPEC-??? | Cache de detalhe por slug | Otimizar `/api/v1/stores/:slug` quando o trafego justificar |

### Em execucao (so em branches - nao aparece em main)
| ID | Titulo | Branch |
|---|---|---|
| SPEC-20260506-1400 | Endpoints publicos de lojas com cache Redis | feature/SQU-43-api-publica |
| SPEC-20260514-2012 | Isolamento multitenant de stores com testes reais | feature/SQU-47-validacao-de-isolamento |
| SPEC-20260516-1430 | CRUD completo de lojas no admin | feature/SQU-42-api-admin-crud-de-lojas |
| SPEC-20260516-1730 | Catalogo de lojas - fase 2 publica e operacional | feature/store-catalog-phase-2 |

## Estado atual

A feature entregou primeiro o schema minimo e a listagem publica cacheada. Desde 2026-05-16 17:30, a SPEC-20260516-1730 fecha o restante da experiencia publica:
- detalhe completo por slug
- endpoint publico de categorias
- busca full-text no Postgres
- paginas `/lojas` e `/lojas/[slug]` no portal

Decisoes ativas:
- isolamento por tenant continua obrigatorio em toda query
- cache Redis segue focado na listagem publica
- full-text complementa a busca, mas o contrato HTTP continua simples via querystring
