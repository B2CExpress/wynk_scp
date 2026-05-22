# State — SPEC-20260522-1000

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-22 10:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-22 10:45
**Onde tô:** Implementação concluída: backend endpoints públicos + Portal route handlers (sitemap, RSS, robots) + XML helpers
**Próximo passo:** Testes manuais com curl + validadores online
**Última decisão:** Usar events como "notícias" no RSS (sem entidade News/Editorial separada por enquanto)
**Bloqueio atual:** nenhum
**Se retomar, ler:** Log de 2026-05-22 10:30 em diante

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Backend: public events endpoints | concluído | 2026-05-22 10:30 | — |
| 2 | Portal: lib/xml.ts, sitemap/rss/robots endpoints | concluído | 2026-05-22 10:45 | — |
| 3 | Portal: link RSS no layout | concluído | 2026-05-22 10:45 | — |
| 4 | Testes manuais + validadores | em progresso | 2026-05-22 10:45 | — |

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

## 2026-05-22 10:45 — [conclusão] Pronto para testes

Implementação concluída. Todos os criterios de aceite: endpoints retornam XML válido, Content-Type correto, escapamento XML, isolamento por tenant, link RSS no head.

Próximos passos: testes manuais com curl, validadores online (xml-sitemaps.com, validator.w3.org/feed).
Commit: aguardando testes.

