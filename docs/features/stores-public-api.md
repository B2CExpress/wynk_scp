# Feature: stores-public-api

**Keywords:** stores, public-api, redis, cache, listagem, paginacao, filtros, tenant-isolation
**Arquivos principais:**
  - backend/lib/cache.ts
  - backend/app/api/v1/stores/route.ts
**Resumo:** API pública (sem auth) que expõe a listagem de lojas ativas de cada tenant ao portal do visitante, com cache Redis de 5 min, fallback gracioso ao banco se Redis cair, e isolamento estrito por `x-tenant-id` em todas as queries. Endpoint de detalhe (`/[slug]`) fica para SPEC futura.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| _(nenhuma ainda)_ | — | — | — |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | — | — |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260506-1400 | Endpoints públicos de lojas com cache Redis | feature/SQU-43-api-publica |

## Estado atual

Feature recém-criada — ainda não há SPEC concluída. Implementação atual vive na branch `feature/SQU-43-api-publica` (PR #3) e está sob review.

Forma planejada (SPEC-20260506-1400 — listagem-only):
- 1 endpoint `GET /api/v1/stores` (listagem com filtros + paginação).
- Tenant resolvido via header `x-tenant-id` injetado por middleware (entregue por SPEC externa, não esta).
- Cache Redis com TTL de 5 min, chave determinística `stores:list:{tenant}:cat=:feat=:l=:p=:q=:rest=`.
- Invalidação via SCAN cursor + DEL (nunca KEYS) ao salvar/deletar no admin.
- Headers HTTP para CDN futura: `Cache-Control: public, max-age=300, s-maxage=300`, `Vary: x-tenant-id`, `X-Cache: HIT|MISS`.
- Degradação graciosa: Redis indisponível → query no banco, sem 500.

> Endpoint `GET /api/v1/stores/[slug]` (detalhe) chegou a ser implementado em `96b5a33` mas foi removido em `759eca5` (subiu por engano). Será objeto de SPEC futura.

> Última atualização: 2026-05-08 13:50 (SPEC-20260506-1400)

## Decisões arquiteturais ativas

- **Cache key inclui todos os filtros ordenados alfabeticamente** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — Evita HIT incorreto quando filtros mudam. Trade-off: chaves mais longas, mas determinísticas.
- **Isolamento por tenant em TODA query, inclusive JOINs com `categories`** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — Prevenir vazamento entre tenants é objetivo principal da feature. Trade-off: redundância aparente nos `WHERE`, mas defesa em profundidade.
- **Fallback gracioso ao banco quando Redis cair** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — Cache não é fonte da verdade. Trade-off: latência mais alta em falha de Redis vs disponibilidade do endpoint.
- **SCAN cursor (não KEYS) para invalidação em produção** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — KEYS bloqueia event loop do Redis. Trade-off: mais roundtrips para SCAN, mas seguro em produção.

## Alternativas consideradas e rejeitadas

- **Full-text search nativo (Postgres tsvector)** — rejeitado em SPEC-20260506-1400 (2026-05-08 13:35). Motivo: escopo da v1; ILIKE basta para o tráfego inicial. FTS planejado para v2.5 em SPEC futura.
- **Endpoints autenticados / rate limiting por IP** — rejeitado em SPEC-20260506-1400 (2026-05-08 13:35). Motivo: portal público sem login; rate limiting será implementado no edge (CDN/WAF), não no app.

## Gotchas

- **Wildcards SQL no `search`** (2026-05-08 13:35, SPEC-20260506-1400) — `%` e `_` no input são interpretados como wildcards LIKE. Buscar por `"50%"` retorna tudo. Escapar antes de passar ao ILIKE; e normalizar (lowercase + trim) antes de compor cache key.
- **Cache de `null` (slug inexistente)** (2026-05-08 13:35, SPEC-20260506-1400) — `cached()` armazena 404 por 5 min. Anti-stampede, mas atenção pós-criação: até a invalidação rodar, novo slug retorna 404 cacheado.
- **Rename de slug invalida só o slug informado** (2026-05-08 13:35, SPEC-20260506-1400) — `invalidateAllStoresCaches(tenantId, slug?)` recebe um único slug; se admin mudar slug, antigo continua quente até TTL expirar. Endpoint admin precisa invalidar **antigo + novo**.
- **Header `Vary: x-tenant-id` é crítico para CDN** (2026-05-08 13:35, SPEC-20260506-1400) — sem ele, CDN serve resposta de um tenant para outro. Não remover sob nenhum pretexto.
- **`limit > 50` é silenciosamente clampado** (2026-05-08 13:35, SPEC-20260506-1400) — não retorna 400. Documentar no contrato público quando houver doc OpenAPI.

## Estado congelado (se houver)

_(nenhum)_
