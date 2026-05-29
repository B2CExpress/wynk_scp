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
| SPEC-20260526-1326 | 2026-05-26 | _(commit pendente)_ | Hotfix em `findActiveListing`: orderBy passa a usar propriedades da entity (`store.isFeatured`, `store.sortOrder`, `store.name`) em vez de nomes de coluna do banco — TypeORM 0.3 não resolve metadata com inner join + paginação quando usa colunas DB cruas (scope creep originado durante SPEC de seed-demo) |

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
- **`orderBy`/`addOrderBy` em QueryBuilder sempre usa propriedade da entity, nunca nome de coluna DB** (origem: SPEC-20260526-1326, 2026-05-26 14:50) — TypeORM 0.3 com `skip`+`take` + inner join precisa resolver metadata de cada coluna em orderBy pra wrappar em DISTINCT subquery; usar coluna DB crua (ex.: `store.store_is_featured`) retorna `undefined` no lookup e estoura `Cannot read properties of undefined (reading 'databaseName')`. Convenção: `store.isFeatured`, `store.sortOrder`, `store.name`.

## Gotchas

- **`orderBy('alias.<coluna_db>')` quebra com inner join + paginação no TypeORM 0.3** (2026-05-26 14:48, [[SPEC-20260526-1326]]) — sintoma: 500 em listagem com filtros que envolvem join (`?category=...`). Erro: `Cannot read properties of undefined (reading 'databaseName')` em `SelectQueryBuilder.createOrderByCombinedWithSelectExpression`. Fix: usar nomes de propriedade da entity (camelCase) em todos os orderBy/addOrderBy. Não importa se o resto da query usa nomes DB (em `where`/`andWhere` com SQL cru funciona); só orderBy precisa do nome de propriedade pra TypeORM resolver metadata.
