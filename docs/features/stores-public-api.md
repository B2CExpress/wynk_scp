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
| SPEC-20260506-1400 | 2026-05-12 | `8199c7e` | Endpoints públicos de lojas com cache Redis (+ schema mínimo) |
| SPEC-20260514-2012 | 2026-05-18 | `b38052c` | Isolamento multitenant de stores com testes reais |
| SPEC-20260516-1430 | 2026-05-18 | `7642216` | CRUD completo de lojas no admin |
| SPEC-20260516-1730 | 2026-05-18 | `8aef2da` | Catálogo de lojas - fase 2 pública e operacional |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| SPEC-??? | Cache de detalhe por slug | Otimizar `/api/v1/stores/:slug` quando o trafego justificar |

### Em execucao (so em branches - nao aparece em main)
| ID | Titulo | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

A feature entregou primeiro o schema minimo e a listagem publica cacheada. Desde 2026-05-16 17:30, a SPEC-20260516-1730 fecha o restante da experiencia publica:
- detalhe completo por slug
- endpoint publico de categorias
- busca full-text no Postgres
- paginas `/lojas` e `/lojas/[slug]` no portal

## Decisões arquiteturais ativas

- **Isolamento por tenant continua obrigatório em toda query** (origem: SPEC-20260503-1505 + SPEC-20260514-2012) — `withTenant(qb)` em listagem/detalhe; subscriber rejeita cross-tenant em runtime.
- **Cache Redis focado na listagem pública** (origem: SPEC-20260506-1400, 2026-05-12) — TTL 300s, chave inclui `tenant_id` + filtros. Detalhe por slug ainda não tem cache (registrado como SPEC futura).
- **Busca full-text Postgres com fallback ILIKE** (origem: SPEC-20260516-1730, 2026-05-16) — coluna gerada `store_search_vector` (`tsvector` com `name` peso A + `description` peso B) + GIN index. Query usa `websearch_to_tsquery('simple', :q)` OR `name ILIKE %q%` por robustez. Contrato HTTP continua simples (`?search=...`).
- **Endpoint público sem auth** (origem: SPEC-20260506-1400) — `GET /api/v1/stores` e `/:slug` são públicos; resolução de tenant via `Host`/`X-Forwarded-Host` apenas.
- **DTO de listagem é enxuto** (origem: SPEC-20260506-1400) — só campos necessários pra card (id, name, description, slug, logoUrl, coverImageUrl, floor, phone, isRestaurant, isFeatured, sortOrder). Detalhe traz o resto (`external_url`, `opening_hours`, `categories`).
