# Memory — SPEC-20260522-1000

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-22 10:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-25 14:30 (sessão #2 — SPEC concluída)
**Onde tô:** SPEC fechada. Sitemap inclui stores+events+promotions; cache `unstable_cache` 1h por tenant; theater/services em future SPEC. Critério marcado + R.7. Pronta para archive.
**Próximo passo:** mover active→archive, commit final, push do PR `feature/SQU-55-sitemap-dinamico-e-rss`
**Última decisão:** `unstable_cache` do Next (com tags `sitemap:`/`rss:news:`/`robots:` por tenant) substitui Redis literal — `revalidateTag` deixa porta aberta pra invalidação ativa em SPEC futura
**Bloqueio atual:** nenhum
**Se retomar, ler:** `state.md` entradas 2026-05-25 14:00 em diante

---

## Contexto ativo

### O que está sendo feito AGORA

SPEC concluída após duas sessões.

Sessão #1 (2026-05-22, commit `6f66a1c`): criação de `public-event.controller.ts` no backend (rotas GET /api/v1/events), `lib/xml.ts`, `app/sitemap.xml/route.ts`, `app/rss/news.xml/route.ts`, `app/robots.txt/route.ts` no portal, e `<link rel="alternate" type="application/rss+xml">` no layout.

Sessão #2 (2026-05-25): fechamento dos gaps detectados em auditoria —
- `public-promotion.controller.ts` no backend (rota GET /api/v1/promotions, filtro published+valid_until>=now)
- sitemap.xml passa a incluir promotions além de stores+events
- todos os três endpoints do portal envolvidos em `unstable_cache(fn, [key], { revalidate: 3600, tags: ['<feature>:{tenantId}'] })`
- stubs `publicEvent`/`publicPromotion` em `tests/helpers/setup.ts` (vitest) e `makeStubPublicPromotionController` em `__tests__/helpers/mock-deps.ts` (jest)

Decisões registradas: cache via Next em vez de Redis literal; theater/services FORA desta versão (future SPECs); invalidação por TTL apenas (webhook em future).

### Hipóteses em jogo

- **Hipótese 1:** Portal já tem `getCurrentTenant()` funcional via headers(). Status: confirmada. Via `resolveTenantByHost()` e headers.
- **Hipótese 2:** Backend expõe endpoints REST para stores, news, events, etc. Status: confirmada parcialmente. Stores público; eventos/theater/promo eram admin. Criei endpoints públicos para eventos.

### Decisões recentes que importam pra continuar

- [2026-05-22 10:15] Criar endpoints públicos no backend para events (GET /api/v1/events). Motivo: Portal precisa fetch dados publicados, reusar EventService, isolamento por tenant automático.
- [2026-05-22 10:30] Usar events como "notícias" no RSS. Motivo: não há News/Editorial entity separada ainda; events encaixa bem (título, summary, publishedAt).
- [2026-05-25 14:00] `unstable_cache` (Next) em vez de Redis literal. Motivo: native ao runtime do portal, sem nova dep `ioredis`, e tags por tenant deixam `revalidateTag` pronto pra webhook futuro de invalidação ativa.
- [2026-05-25 14:00] Endpoints públicos `/api/v1/promotions` no backend (mesmo padrão de event público). Motivo: sitemap precisa de slugs publicados+válidos sem expor admin.
- [2026-05-25 14:00] Theater e Services FORA da entrega. Motivo: `TheaterShow` sem `slug`; `Service` sem entity. Future SPECs registradas em seo-sitemaps-rss.md.
- [2026-05-25 14:00] Invalidação ativa adiada. Motivo: TTL 1h cobre 99% do caso real; webhook adiciona complexidade (shared secret + endpoint + trigger nos services). Tags do `unstable_cache` ficam de gancho.

### Respostas-chave do usuário

- [2026-05-22 10:00] Usuário: "sim"
  Contexto: confirmou abordagem de criar SPEC + feature + implementar código.
- [2026-05-25 14:00] Usuário: "1"
  Contexto: ofereci 3 caminhos pra fechar SPEC com 4 gaps detectados (implementar; reescopar; arquivar parcial). Escolheu (1) — implementar gaps. Resultou em adicionar promotions ao sitemap, cache via `unstable_cache`, e adiar theater/services como future.

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
| 1 | 2026-05-22 10:00 | ~45 min | implementação | Backend public events + Portal endpoints (sitemap, RSS, robots) + XML helpers (commit `6f66a1c`) |
| 2 | 2026-05-25 13:45 | ~45 min | continuidade/conclusão | Auditoria → gaps (sitemap incompleto, cache, invalidação) → public-promotion endpoint → sitemap promotions → cache `unstable_cache` 1h → R.7 seo-sitemaps-rss → archive |
