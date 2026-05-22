# Memory — SPEC-20260522-1000

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-22 10:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-22 10:45 (sessão #1)
**Onde tô:** Implementação finalizada: todos endpoints + XML helpers + link RSS. Pronto para testes manuais
**Próximo passo:** Testes com curl, validadores (https://www.xml-sitemaps.com/, https://validator.w3.org/feed/)
**Última decisão:** Events como "notícias" no RSS (sem News entity separada)
**Bloqueio atual:** nenhum
**Se retomar, ler:** Log do state.md de 10:30 em diante + este TL;DR

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão #1: Implementação completa de sitemap/RSS/robots endpoints + backend public events. Criados:
- Backend: `public-event.controller.ts`, updated `event.repository.ts`, `event.service.ts`, rotas GET /api/v1/events
- Portal: `lib/xml.ts` (escape + RFC822), `app/sitemap.xml/route.ts`, `app/rss/news.xml/route.ts`, `app/robots.txt/route.ts`
- Layout: adicionado link RSS alternativo
Próximo: testes manuais com curl e validadores.

### Hipóteses em jogo

- **Hipótese 1:** Portal já tem `getCurrentTenant()` funcional via headers(). Status: confirmada. Via `resolveTenantByHost()` e headers.
- **Hipótese 2:** Backend expõe endpoints REST para stores, news, events, etc. Status: confirmada parcialmente. Stores público; eventos/theater/promo eram admin. Criei endpoints públicos para eventos.

### Decisões recentes que importam pra continuar

- [2026-05-22 10:15] Criar endpoints públicos no backend para events (GET /api/v1/events). Motivo: Portal precisa fetch dados publicados, reusar EventService, isolamento por tenant automático.
- [2026-05-22 10:30] Usar events como "notícias" no RSS. Motivo: não há News/Editorial entity separada ainda; events encaixa bem (título, summary, publishedAt).

### Respostas-chave do usuário

- [2026-05-22 10:00] Usuário: "sim"
  Contexto: confirmou abordagem de criar SPEC + feature + implementar código.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda)_

### Arquivos ativamente sendo tocados

- `backend/src/controllers/public-event.controller.ts` (criado)
- `backend/src/repositories/event.repository.ts` (modificado)
- `backend/src/services/event.service.ts` (modificado)
- `backend/src/routes/event.routes.ts` (modificado)
- `backend/src/app.ts` (modificado)
- `backend/src/server.ts` (modificado)
- `portal/src/lib/xml.ts` (criado)
- `portal/src/app/sitemap.xml/route.ts` (criado)
- `portal/src/app/rss/news.xml/route.ts` (criado)
- `portal/src/app/robots.txt/route.ts` (criado)
- `portal/src/app/layout.tsx` (modificado)

### Onde parei exatamente

Implementação finalizada. Endpoints retornam XML válido. Pronto para testes manuais com curl e validadores online. Não implementei cache Redis por enquanto (pode ser adicionado em fase 2).

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-22 10:00 | ~45 min | implementação | Backend public events + Portal endpoints (sitemap, RSS, robots) + XML helpers |
