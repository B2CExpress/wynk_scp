# Feature: stores-public-api

**Keywords:** stores, public-api, redis, cache, listagem, paginacao, filtros, tenant-isolation
**Arquivos principais:**
  - backend/src/controllers/store.controller.ts (planejado — pós SPEC-1506)
  - backend/src/services/store.service.ts (planejado — pós SPEC-1506)
  - backend/src/repositories/store.repository.ts (planejado — pós SPEC-1506)
  - backend/src/routes/store.routes.ts (planejado — pós SPEC-1506)
  - backend/src/utils/cache.ts ou backend/src/services/cache.service.ts (planejado — pós SPEC-1506)
**Resumo:** API pública (sem auth) que expõe a listagem de lojas ativas de cada tenant ao portal do visitante, com cache Redis de 5 min, fallback gracioso ao banco se Redis cair, e isolamento estrito por `tenant_id` (resolvido via `host` + `AsyncLocalStorage` da SPEC-1505) em todas as queries. Endpoint de detalhe (`/[slug]`) fica para SPEC futura.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| _(nenhuma ainda)_ | — | — | — |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| SPEC-20260508-1400 | Endpoint público de detalhe de loja por slug | Detalhe `/api/v1/stores/[slug]` foi extraído da SPEC-20260506-1400 após escopo divergente — vai entrar como SPEC própria com 404 unificado, invalidação por rename e helpers compartilhados |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260506-1400 | Endpoints públicos de lojas com cache Redis | feature/SQU-43-api-publica |

## Estado atual

Feature em re-escopo radical após merge de `main` em `c789654` (2026-05-11 16:47) que trouxe a SPEC-20260503-1505 concluída e mudou a stack do backend de Next.js+Drizzle para Express 4 + TypeORM 0.3. Implementação anterior (`backend/lib/cache.ts` + `backend/app/api/v1/stores/route.ts`, Drizzle/Next.js) foi **deletada em 2026-05-11 17:24**. SPEC-20260506-1400 permanece ativa na branch, mas bloqueada aguardando a SPEC-20260503-1506-modulo-lojas, que entrega o schema das tabelas.

Forma planejada (SPEC-20260506-1400 — listagem-only, pós re-escopo):
- 1 endpoint `GET /api/v1/stores` (listagem com filtros + paginação), em Express controller/service/repository.
- Tenant resolvido via `host` HTTP → `/tenant/resolve` (Redis 10 min) → `AsyncLocalStorage` + helper `withTenant(qb)`, entregues pela SPEC-1505. **Sem header `x-tenant-id`**.
- Schema (entregue pela SPEC-1506): `tb_store`, `tb_category`, `tb_store_category` (TypeORM com naming `store_*`, `category_*`).
- Cache Redis com TTL de 5 min, chave determinística `stores:list:{tenant}:cat=:feat=:l=:p=:q=:rest=` (com `search` lowercase+trim ANTES de virar parte da chave).
- Invalidação via SCAN cursor + DEL (nunca KEYS) ao salvar/deletar no admin (endpoints admin entregues pela SPEC-1506).
- Headers HTTP para CDN futura: `Cache-Control: public, max-age=300, s-maxage=300`, `Vary: x-forwarded-host` (ou equivalente do tenant resolution real), `X-Cache: HIT|MISS`.
- Degradação graciosa: Redis indisponível → query no banco, sem 500.

> Endpoint `GET /api/v1/stores/[slug]` (detalhe) chegou a ser implementado em `96b5a33` mas foi removido em `759eca5` (subiu por engano). Será objeto da SPEC-20260508-1400-stores-public-detail (em `future/`).

> Última atualização: 2026-05-11 17:24 (SPEC-20260506-1400, re-escopo radical pós-merge SPEC-1505)

## Decisões arquiteturais ativas

- **Cache key inclui todos os filtros ordenados alfabeticamente** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — Evita HIT incorreto quando filtros mudam. Trade-off: chaves mais longas, mas determinísticas.
- **Isolamento por tenant em TODA query, inclusive JOINs com `tb_category`** (origem: SPEC-20260506-1400, 2026-05-08 13:35; re-confirmada em 2026-05-11 17:24) — Prevenir vazamento entre tenants é objetivo principal da feature. Trade-off: redundância aparente nos `WHERE`, mas defesa em profundidade. Subscriber TypeORM da SPEC-1505 já cobre INSERT/UPDATE/DELETE; SELECTs cruzados ainda exigem `WHERE` explícito via `withTenant(qb)`.
- **Fallback gracioso ao banco quando Redis cair** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — Cache não é fonte da verdade. Trade-off: latência mais alta em falha de Redis vs disponibilidade do endpoint.
- **SCAN cursor (não KEYS) para invalidação em produção** (origem: SPEC-20260506-1400, 2026-05-08 13:35) — KEYS bloqueia event loop do Redis. Trade-off: mais roundtrips para SCAN, mas seguro em produção.
- **Stack: Express 4 + TypeORM 0.3 + ioredis** (origem: SPEC-20260506-1400 re-escopada em 2026-05-11 17:24; herda da SPEC-20260503-1505) — Substitui a stack original Next.js App Router + Drizzle, que ficou inválida após o merge de `main` em `c789654`. Trade-off: SPEC perdeu o código já escrito (`bf21c78` deletado), mas alinha 100% com o resto do backend.
- **Tenant resolvido por `host` + `AsyncLocalStorage`, sem header `x-tenant-id`** (origem: SPEC-20260506-1400 re-escopada em 2026-05-11 17:24; herda da SPEC-20260503-1505) — Toda controller acessa o tenant corrente via `getTenantId()` populado pelo middleware da SPEC-1505. Trade-off: handler fica mais limpo (sem `req.headers.get('x-tenant-id')`), mas obriga rodar com middleware ativo em qualquer cenário (incluindo testes).

## Alternativas consideradas e rejeitadas

- **Full-text search nativo (Postgres tsvector)** — rejeitado em SPEC-20260506-1400 (2026-05-08 13:35). Motivo: escopo da v1; ILIKE basta para o tráfego inicial. FTS planejado para v2.5 em SPEC futura.
- **Endpoints autenticados / rate limiting por IP** — rejeitado em SPEC-20260506-1400 (2026-05-08 13:35). Motivo: portal público sem login; rate limiting será implementado no edge (CDN/WAF), não no app.
- **Pausar SPEC-1400 em `future/` até a 1506 estar pronta** — rejeitado em SPEC-20260506-1400 re-escopada (2026-05-11 17:24). Motivo: SPEC-futura `SPEC-20260508-1400-stores-public-detail` já está vinculada e tem `Depende de: SPEC-20260506-1400`; pausar quebra o vínculo. Re-escopo radical com SPEC ativa+bloqueada preserva a topologia.
- **Manter o código antigo Next.js+Drizzle como referência** — rejeitado em SPEC-20260506-1400 re-escopada (2026-05-11 17:24). Motivo: mudança simultânea de framework + ORM torna toda migração equivalente a reescrita; "referência" geraria mais ruído que valor. Pensamento e gotchas preservados em main.md + state.md + gotchas desta feature.
- **Descartar a SPEC-1400 e criar SPEC nova após 1506** — rejeitado em SPEC-20260506-1400 re-escopada (2026-05-11 17:24). Motivo: gotchas, decisões e vínculo com SPEC-futura têm valor real e seriam perdidos no discard. Re-escopo é caminho mais barato.

## Gotchas

- **Wildcards SQL no `search`** (2026-05-08 13:35, SPEC-20260506-1400) — `%` e `_` no input são interpretados como wildcards LIKE. Buscar por `"50%"` retorna tudo. Escapar antes de passar ao ILIKE; e normalizar (lowercase + trim) antes de compor cache key. Foi entregue em `bf21c78` sobre Drizzle/Next.js; código deletado em 2026-05-11 17:24 (re-escopo). Precisa ser **re-entregue** sobre TypeORM na re-implementação.
- **Mudança de stack invalidou implementação anterior** (2026-05-11 17:24, SPEC-20260506-1400) — SPEC-1400 foi iniciada antes da 1505 fixar a stack final. SPEC-1505 mudou backend para Express + TypeORM, exigindo re-escopo radical. Lição para SPECs futuras: SPEC dependente de base não definida deve declarar `Depende de:` desde o início e aguardar — ou ser explícita sobre risco de re-escopo se a base mudar.
- **404 unificado para o detalhe** (2026-05-08 14:00, SPEC-20260508-1400) — diferenciar 404 (não existe) de 403 (existe mas é de outro tenant) expõe enumeração cross-tenant. Manter sempre o mesmo 404 para slug inexistente, slug de outro tenant e loja com `status != active`.
- **Cache de `null` (slug inexistente)** (2026-05-08 14:00, SPEC-20260508-1400) — `cached()` armazena 404 por 5 min. Anti-stampede, mas atenção pós-criação: até a invalidação rodar, novo slug retorna 404 cacheado.
- **Rename de slug invalida só o slug informado** (2026-05-08 14:00, SPEC-20260508-1400) — `invalidateAllStoresCaches(tenantId, slug?)` recebe um único slug; se admin mudar slug, antigo continua quente até TTL expirar. Endpoint admin precisa invalidar **antigo + novo**.
- **Header `Vary: x-tenant-id` é crítico para CDN** (2026-05-08 13:35, SPEC-20260506-1400) — sem ele, CDN serve resposta de um tenant para outro. Não remover sob nenhum pretexto.
- **`limit > 50` é silenciosamente clampado** (2026-05-08 13:35, SPEC-20260506-1400) — não retorna 400. Documentar no contrato público quando houver doc OpenAPI.

## Estado congelado (se houver)

_(nenhum)_
