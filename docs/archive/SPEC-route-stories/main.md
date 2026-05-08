# SPEC-20260508-1400: Public Editorial API

**Status:** active
**Criada:** 2026-05-08 14:00
**Ativada:** 2026-05-08 14:00
**Concluída:** —
**Commit final:** —
**Keywords:** public-api, editorial, cache, redis, noticias, eventos, teatro, promocoes, servicos
**Features:** noticias, eventos, teatro, promocoes, servicos
**Branch:** feature/public-editorial-api
**Depende de:** SPEC-20260503-1505 (base — withTenant + middleware), SPEC-20260503-1506 (lojas — lib/cache.ts), SPEC-20260503-1507 (editorial — schemas das entidades)
**Origem:** usuário em 2026-05-08 14:00
**Resumo:** Expõe 10 endpoints públicos REST (listagem + detalhe para 5 entidades editoriais) com cache Redis 5 min, headers HTTP de cache e isolamento total por tenant.

## Objetivo

Fornecer ao portal público uma API padronizada para consumir conteúdo editorial (notícias, eventos, teatro, promoções, serviços) com latência mínima via cache Redis e proteção de cross-tenant em todas as rotas.

## Escopo

**DENTRO:**
- 10 rotas em `app/api/v1/`: `/news`, `/news/[slug]`, `/events`, `/events/[slug]`, `/theater-shows`, `/theater-shows/[slug]`, `/promotions`, `/promotions/[slug]`, `/services`, `/services/[slug]`
- Filtros por query params: `page`, `limit` (max 20), `category`, `store_id`, `include_past`
- Filtros de visibilidade padrão: `status=published AND published_at <= now()`
- Eventos: `starts_at >= now()` por padrão; `?include_past=true` para incluir passados
- Promoções: `valid_until >= now()` sempre (404 para slug expirado)
- Theater-shows: `next_session_at` (subquery MIN das sessões futuras) + `sessions_count` na listagem; detalhe inclui `sessions[]` futuras
- Promotions: JOIN em `stores` para incluir `{ slug, name, logo_url }`
- Cache Redis com chaves `{tipo}:list:{tenant_id}:{filters_hash}` e `{tipo}:detail:{tenant_id}:{slug}`, TTL 300s
- Headers HTTP: `Cache-Control: public, max-age=300, s-maxage=300` + `Vary: x-tenant-id` + `X-Cache: HIT|MISS`
- Funções `invalidate{Tipo}Cache(tenant_id)` chamadas em cada escrita admin; promoções invalidam também cache da loja vinculada
- Isolamento por tenant: slug de outro tenant retorna 404

**FORA:**
- Autenticação nas rotas públicas (são abertas)
- Endpoints admin/escrita (CRUD das entidades — SPEC-1507)
- Editor de conteúdo / WYSIWYG
- Push notifications, comentários, interação social
- Export CSV (SPEC-1509)
- Paginação cursor-based (offset suficiente para MVP)
- A/B testing, personalização por usuário

## Implementação

- Reutilizar `withTenant(tenant_id)` da SPEC-1505 para todas as queries — proibido query sem escopo
- Reutilizar `lib/cache.ts` com `cached(key, ttl, fetchFn)` da SPEC-1506 — não reimplementar
- Helper genérico `listarPublico(tabela, tenant_id, params)` encapsula o padrão: cache check → query → set cache → headers (ver pseudocódigo no brief)
- Rotas de detalhe: validar slug AND `tenant_id` — não retornar 200 se pertence a outro tenant
- Promoções expiradas (`valid_until < now()`): retornar 404 mesmo que slug exista
- Theater-shows: subquery `MIN(sessions.starts_at) WHERE starts_at > now()` para `next_session_at`; `COUNT` filtrado igual para `sessions_count`
- Arquivos principais:
  - `app/api/v1/news/route.ts` e `app/api/v1/news/[slug]/route.ts`
  - `app/api/v1/events/route.ts` e `app/api/v1/events/[slug]/route.ts`
  - `app/api/v1/theater-shows/route.ts` e `app/api/v1/theater-shows/[slug]/route.ts`
  - `app/api/v1/promotions/route.ts` e `app/api/v1/promotions/[slug]/route.ts`
  - `app/api/v1/services/route.ts` e `app/api/v1/services/[slug]/route.ts`
  - `lib/public-api.ts` — helper genérico de listagem pública + invalidação de cache

## Critério de aceite

- [ ] 10 endpoints respondendo com shape correto de JSON
- [ ] Filtros públicos consistentes: `status=published` + `published_at <= now()` em todas as listagens
- [ ] Eventos passados ocultos por padrão; `?include_past=true` os inclui
- [ ] Promoções expiradas ocultas em listagem e 404 no detalhe
- [ ] Theater-shows retorna `next_session_at`, `sessions_count` na listagem e `sessions[]` futuras no detalhe
- [ ] Promotions retorna dados da loja vinculada (JOIN)
- [ ] Cache HIT na segunda chamada (header `X-Cache: HIT`)
- [ ] Headers HTTP de cache presentes em todas as rotas
- [ ] Slug de tenant B acessado via tenant A retorna 404 (cross-tenant blindado)
- [ ] `invalidate{Tipo}Cache` é chamada em cada escrita admin das entidades
- [ ] **Features tocadas (noticias, eventos, teatro, promocoes, servicos) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado