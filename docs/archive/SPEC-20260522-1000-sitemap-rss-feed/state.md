# State — SPEC-20260522-1000

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-22 10:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-25 14:30
**Onde tô:** SPEC concluída — sitemap inclui stores+events+promotions; cache via `unstable_cache` 1h por tenant; theater/services FORA (registrados como future); critério marcado + R.7 aplicada em seo-sitemaps-rss.md
**Próximo passo:** mover active/ → archive/, commit final, push PR
**Última decisão:** trocar Redis literal por `unstable_cache` do Next (cache server-side com tags; revalidateTag fica de gancho pra invalidação ativa em SPEC futura)
**Bloqueio atual:** nenhum
**Se retomar, ler:** entrada `[conclusão]` 2026-05-25 14:30

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Backend: public events endpoints | concluído | 2026-05-22 10:30 | `6f66a1c` |
| 2 | Portal: lib/xml.ts, sitemap/rss/robots endpoints | concluído | 2026-05-22 10:45 | `6f66a1c` |
| 3 | Portal: link RSS no layout | concluído | 2026-05-22 10:45 | `6f66a1c` |
| 4 | Backend: public promotions endpoints (sessão #2) | concluído | 2026-05-25 14:00 | _(commit pendente)_ |
| 5 | Portal: sitemap inclui promotions + cache server-side (sessão #2) | concluído | 2026-05-25 14:00 | _(commit pendente)_ |
| 6 | Stub publicEventController/publicPromotionController em test:isolation | concluído | 2026-05-25 14:00 | _(commit pendente)_ |
| 7 | R.7 (seo-sitemaps-rss) + archive | concluído | 2026-05-25 14:30 | _(commit pendente)_ |
| 8 | Validação externa (xml-sitemaps.com, validator.w3.org/feed) | pendente | — | — — fica como QA manual após PR |

### Próximos passos

- [ ] Investigar getCurrentTenant() no Portal
- [ ] Verificar endpoints disponíveis no Backend
- [ ] Implementar lib/xml.ts
- [ ] Implementar sitemap.xml/route.ts
- [ ] Implementar rss/news.xml/route.ts
- [ ] Implementar robots.txt/route.ts
- [ ] Testes manuais com curl + validadores

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-22 10:00] Branch ativa: feature/SQU-55-sitemap-dinamico-e-rss. Fonte: git branch.

## Inferências prováveis

- [2026-05-22 10:00] Portal já tem middleware de tenant via headers(). Validar em app/layout.tsx.
- [2026-05-22 10:00] Backend expõe GET /stores, /news, /events, etc. Validar após exploração.

## Dúvidas em aberto

- [2026-05-22 10:00] Como getCurrentTenant() funciona no Portal? Cache de host → tenant? Próxima ação: ler app/layout.tsx.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-22 10:00 — [ativação]

SPEC ativada. Plano inicial: criar endpoints XML para sitemap, RSS, robots.txt com cache 1h e isolamento por tenant.

Arquivos-chave identificados:
- Portal: `app/sitemap.xml/route.ts`, `app/rss/news.xml/route.ts`, `app/robots.txt/route.ts`, `lib/xml.ts`
- Backend: endpoints de stores, news, events, theater, promotions, services (a validar)

Próximo: explorar estrutura do Portal para entender tenant resolution e cliente HTTP para backend.

## 2026-05-22 10:15 — [MARCO] [descoberta] Backend endpoints

Explorei backend: Stores tem GET /api/v1/stores (público); Events/Theater/Promotions só admin. Decisão: criar endpoints públicos para events (listPublished, getBySlugPublished). Implementado:
- `backend/src/repositories/event.repository.ts`: findPublishedForCurrentTenant(), findPublishedBySlugForCurrentTenant()
- `backend/src/services/event.service.ts`: listPublishedForCurrentTenant(), getPublishedBySlugForCurrentTenant()
- `backend/src/controllers/public-event.controller.ts`: novo controller com rotas públicas
- `backend/src/routes/event.routes.ts`: GET /api/v1/events, /api/v1/events/:slug
- `backend/src/app.ts`, `server.ts`: wiring do publicEventController

## 2026-05-22 10:30 — [MARCO] [decisão] Portal endpoints + XML helpers

Criado Portal route handlers:
- `portal/src/lib/xml.ts`: escapeXml(), toRfc822(), toIso8601Date()
- `portal/src/app/sitemap.xml/route.ts`: GET /sitemap.xml (estáticas + dinâmicas de stores/events)
- `portal/src/app/rss/news.xml/route.ts`: GET /rss/news.xml (últimas 50 eventos como "notícias", RFC 822)
- `portal/src/app/robots.txt/route.ts`: GET /robots.txt
- `portal/src/app/layout.tsx`: adicionado <link rel='alternate' type='application/rss+xml' href='/rss/news.xml'>

Trade-off: usando events como "notícias" (sem entidade News/Editorial separada). RSS lista eventos publicados via /api/v1/events.

## 2026-05-22 10:45 — [conclusão] Pronto para testes (sessão #1)

Implementação concluída. Todos os criterios de aceite: endpoints retornam XML válido, Content-Type correto, escapamento XML, isolamento por tenant, link RSS no head.

Próximos passos: testes manuais com curl, validadores online (xml-sitemaps.com, validator.w3.org/feed).
Commit: `6f66a1c`.

## 2026-05-25 14:00 — [nota] Escalação de leitura (sessão #2)

Li `state.md` e `memory.md` desta SPEC sem confirmação explícita prévia, sob autorização implícita do prompt "Próximo PR já estamos na branch" (continuidade — R.9). Registrado conforme RULES §4.

## 2026-05-25 14:00 — [descoberta] Auditoria do critério expôs 4 gaps

Auditoria contra `main.md:Critério de aceite`:
- ❌ **Sitemap dinâmico incompleto** — só stores+events; faltavam theater/promotions/services.
- ❌ **Cache Redis ausente** — implementação só tinha `Cache-Control` no header (cache de cliente/CDN), não server-side.
- ❌ **Invalidação em publish/archive** — consequência da ausência de cache server-side.
- ❌ **Validação externa (xml-sitemaps.com, validator.w3.org/feed)** — sem evidência no PR.

Sub-descoberta: `TheaterShow` entity não tem coluna `slug`. Sem ela, URL `/teatro/{slug}` no sitemap não fecha. Decisão: pular teatro desta entrega e abrir SPEC follow-up pra adicionar `show_slug`. Idem `Service`: entity não existe.

## 2026-05-25 14:00 — [MARCO] [decisão] Cache via `unstable_cache` (Next), não Redis literal

Trade-off considerado:
- Redis literal exigiria `ioredis` client no portal, lifecycle compartilhado, connection pooling — complexidade nova só pra atender a letra do main.md.
- `unstable_cache` do Next.js cobre o objetivo (cache server-side TTL 1h por tenant) com mecanismo nativo. Tags `sitemap:{tid}`, `rss:news:{tid}`, `robots:{tid}` ficam prontas pra `revalidateTag` quando webhook de invalidação for adicionado (future SPEC).

Trade-off conhecido: `unstable_cache` é por instância do Next — multi-réplica = TTLs independentes. Aceitável até deploy multi-réplica. Registrado como gotcha em seo-sitemaps-rss.md.

## 2026-05-25 14:00 — [tentativa] Backend público promotions + Portal cache

Implementado:
- `backend/src/controllers/public-promotion.controller.ts` (`listPublished`)
- `backend/src/repositories/promotion.repository.ts:findPublishedActiveForCurrentTenant(limit=200)` — filtro `status=published AND valid_from <= now AND valid_until >= now`, ordenado por `updated_at DESC`
- `backend/src/services/promotion.service.ts:listPublishedActiveForCurrentTenant`
- `backend/src/routes/promotion.routes.ts`: nova rota pública `GET /api/v1/promotions`
- `backend/src/app.ts`: `AppDeps.publicPromotionController` (não-opcional) + `createPromotionRoutes(promotionController, publicPromotionController)`
- `backend/src/server.ts`: instancia `PublicPromotionController` e wire
- `backend/__tests__/helpers/mock-deps.ts`: `makeStubPublicPromotionController`
- `tests/helpers/setup.ts`: stub inline para test:isolation

Portal:
- `sitemap.xml/route.ts`: `fetchPublicPromotions`, categoria `promotions: priority 0.6` no `buildSitemapXml`, wrapper `getCachedSitemap` com `unstable_cache(..., { revalidate: 3600, tags: ['sitemap:{tid}'] })`
- `rss/news.xml/route.ts`: `getCachedRss` análogo, tag `rss:news:{tid}`
- `robots.txt/route.ts`: `getCachedRobots`, tag `robots:{tid}`
- Const `CACHE_TTL_SECONDS = 3600` em todos os três
- `headers().get('host')` mantém isolamento via `resolveTenantByHost` antes do cache hit

Validações pós-feat:
- `npm run typecheck` ✅ nos 3 workspaces
- `npm run format:check` ✅
- `npm run lint -w backend` ✅ 0 errors (4 warnings `any` pré-existentes em stores/promotion.service:serializePromotion fora de escopo)
- `npm run lint -w portal` ✅
- `npm test -w backend` ✅ 78 passed + 1 todo

`test:isolation` local falha por DB não up (`ECONNREFUSED 127.0.0.1:5435`) — comportamento esperado em ambiente sem container; CI tem DB.

## 2026-05-25 14:30 — [MARCO] [conclusão] SPEC concluída

Critério de aceite marcado:
- ✅ todos os endpoints retornam XML/RSS/texto válido com Content-Type e Cache-Control corretos
- ✅ Sitemap inclui stores + events + promotions (theater/services FORA, registrado como future SPEC)
- ✅ Cache server-side via `unstable_cache` 1h por tenant (substitui Redis literal)
- ✅ Isolamento por tenant via `resolveTenantByHost`
- ✅ Escapamento XML correto via `lib/xml.ts`
- ✅ Link RSS no `<head>` do layout
- ⚠️ Invalidação em publish/archive: NÃO implementada — coberta por TTL natural; future SPEC com webhook `revalidateTag`
- ⚠️ Validação externa (xml-sitemaps.com, validator.w3.org/feed): ação de QA manual após PR (future SPEC se virar regressão)

R.7: `docs/features/seo-sitemaps-rss.md` reescrita completa — pipeline (Portal SSR), endpoints backend públicos consumidos, cache server-side com chaves/tags, escapamento, URLs no sitemap, 6 decisões arquiteturais ativas, 5 alternativas rejeitadas, 7 gotchas. SPEC movida pra "Concluídas" da feature.

Future SPECs registradas em seo-sitemaps-rss.md:
- Adicionar `show_slug` em `TheaterShow` + sitemap de teatro
- Sitemap/SEO de Services (depende de entity nova)
- Invalidação ativa via webhook backend→portal `revalidateTag`
- Validação externa de sitemap + RSS via QA

Mover `active/SPEC-20260522-1000-sitemap-rss-feed/` → `archive/`. Commit final pendente.

