# Feature: SEO - Sitemaps e RSS

**Keywords:** SEO, sitemap.xml, RSS feed, robots.txt, indexação, discoverability, unstable_cache, next-cache, tenant-isolation, XML-escape
**Arquivos principais:**
  - `portal/src/app/sitemap.xml/route.ts` (GET `/sitemap.xml` + `unstable_cache` por tenant)
  - `portal/src/app/rss/news.xml/route.ts` (GET `/rss/news.xml` + `unstable_cache` por tenant)
  - `portal/src/app/robots.txt/route.ts` (GET `/robots.txt` + `unstable_cache` por tenant)
  - `portal/src/lib/xml.ts` (`escapeXml`, `toRfc822`, `toIso8601Date`)
  - `portal/src/app/layout.tsx` (`<link rel='alternate' type='application/rss+xml'>` no `<head>`)
  - `backend/src/controllers/public-event.controller.ts` (lista/detalhe pública pra alimentar RSS + sitemap)
  - `backend/src/controllers/public-promotion.controller.ts` (lista pública pra alimentar sitemap; status=published AND valid_until >= now)
  - `backend/src/repositories/event.repository.ts:findPublishedForCurrentTenant/findPublishedBySlugForCurrentTenant`
  - `backend/src/repositories/promotion.repository.ts:findPublishedActiveForCurrentTenant`
  - `backend/src/services/{event,promotion}.service.ts` (métodos `listPublished*`)
**Resumo:** Endpoints SSR no Portal (Next.js App Router) que servem `sitemap.xml`, `rss/news.xml` e `robots.txt` por tenant. Conteúdo dinâmico vem do backend Express via fetch com `X-Forwarded-Host` (rotas públicas `/api/v1/{stores,events,promotions}`). Cache server-side por `unstable_cache` com TTL 1h e tags `sitemap:{tenant_id}` / `rss:news:{tenant_id}` / `robots:{tenant_id}` — `revalidateTag` deixa porta aberta pra invalidação ativa em SPEC futura, hoje só TTL. Escapamento XML restrito (`&` antes de `<` etc.), datas RFC 822 no RSS e ISO 8601 (lastmod) no sitemap.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260522-1000 | 2026-05-25 | _(commit pendente)_ | Sitemap XML + RSS feed + robots.txt |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(a abrir)_ | Adicionar `show_slug` em `TheaterShow` + sitemap de teatro | TheaterShow não tem coluna `slug` hoje; sem ela, sitemap de `/teatro/{slug}` não fecha |
| _(a abrir)_ | Sitemap/SEO de Services | Entity `Service` ainda não existe no domínio |
| _(a abrir)_ | Invalidação ativa de cache (webhook backend→portal `revalidateTag`) | Hoje cache só expira por TTL 1h; SPEC futura cobre revalidação imediata em publish/archive |
| _(a abrir)_ | Validação externa de sitemap + RSS via xml-sitemaps.com / validator.w3.org/feed | Crítério inicial pedia validação third-party; ficou como ação de QA manual após PR |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

### Pipeline (Portal SSR)

```
GET /{sitemap.xml,rss/news.xml,robots.txt}
  ↓ headers().get('host')
  ↓ resolveTenantByHost(host) → 404 se desconhecido
  ↓ unstable_cache (TTL 3600, tag por tenant)
  ↓   ├─ sitemap.xml:   parallel fetch /api/v1/stores, /api/v1/events, /api/v1/promotions
  ↓   ├─ rss/news.xml:  fetch /api/v1/events?limit=50 + loadTheme(flavorSlug) para channel meta
  ↓   └─ robots.txt:    template estático com `Sitemap: https://{host}/sitemap.xml`
  ↓ Content-Type + Cache-Control: public, max-age=3600
```

### Endpoints backend públicos consumidos

| Endpoint | Origem | Status |
|---|---|---|
| `GET /api/v1/stores` | Already existed | público |
| `GET /api/v1/events` | SPEC-20260522-1000 introduziu (`PublicEventController.listPublished`) | público; filtro `status=published AND published_at <= now`, ordenado por `published_at DESC`, limit 50 default |
| `GET /api/v1/events/:slug` | SPEC-20260522-1000 introduziu (`PublicEventController.getBySlugPublished`) | público; 404 se não publicado |
| `GET /api/v1/promotions` | SPEC-20260522-1000 introduziu (`PublicPromotionController.listPublished`) | público; filtro `status=published AND valid_from <= now AND valid_until >= now`, ordenado por `updated_at DESC`, limit 200 default |

Todos os endpoints públicos passam `Cache-Control: public, max-age=3600` + `Vary: X-Forwarded-Host` no header e usam `withTenant()` no repository — isolamento garantido por `resolveTenantByHost` no portal (`X-Forwarded-Host`) que vira tenant context no backend.

### Cache server-side

`unstable_cache(fn, [key], { revalidate: 3600, tags: [tag] })` envolve cada handler:

| Endpoint | Cache key | Tag |
|---|---|---|
| `/sitemap.xml` | `sitemap-xml-{tenantId}` | `sitemap:{tenantId}` |
| `/rss/news.xml` | `rss-news-{tenantId}` | `rss:news:{tenantId}` |
| `/robots.txt` | `robots-{tenantId}` | `robots:{tenantId}` |

Decisão de escapar Redis literal (que o `main.md` da SPEC pedia): Next.js já tem cache server-side nativo via `unstable_cache`, dispensa client `ioredis` no portal. Tags permitem `revalidateTag('sitemap:xxx')` em SPEC futura para invalidação ativa via webhook do backend (hoje só TTL).

### Escapamento XML

`portal/src/lib/xml.ts` exporta:
- `escapeXml(str)` — substitui `& < > ' "` para entidades, **em ordem** (`&` primeiro pra não ser duplo-escapado por `&lt;`)
- `toRfc822(date)` — `date.toUTCString()` retorna `"Wed, 22 May 2026 10:00:00 GMT"` (RSS 2.0)
- `toIso8601Date(date)` — para `<lastmod>` do sitemap

### URLs no sitemap

**Estáticas (sempre):** `/`, `/lojas`, `/noticias`, `/eventos`, `/teatro`, `/promocoes`, `/servicos`

**Dinâmicas (com `<lastmod>` + priority 0.6-0.7):**
- `/lojas/{store.slug}` (status=active)
- `/eventos/{event.slug}` (status=published, published_at <= now)
- `/promocoes/{promotion.slug}` (status=published, valid_from <= now <= valid_until)

**Fora desta entrega (FORA do escopo ajustado):**
- `/teatro/{slug}` — `TheaterShow` entity sem coluna `slug` ainda
- `/servicos/{slug}` — entity `Service` não existe
- `/noticias/{slug}` — não há entity News separada; RSS usa events

> Última atualização: 2026-05-25 14:30 (SPEC-20260522-1000)

## Decisões arquiteturais ativas

- **Cache via `unstable_cache` do Next.js, não Redis** (origem: SPEC-20260522-1000, 2026-05-25 14:00) — Portal SSR já tem mecanismo nativo de cache server-side com tags para invalidação. Trade-off: cache fica no processo do Next (não compartilhado entre réplicas — cada réplica tem TTL próprio); aceitável até deploy multi-réplica. Substitui a sugestão original do main.md de Redis com ioredis no portal (que exigiria client compartilhado). Tags `sitemap:{tid}` / `rss:news:{tid}` / `robots:{tid}` ficam prontas para `revalidateTag` quando webhook de invalidação for adicionado.
- **Backend ganha rotas públicas `/api/v1/{events,promotions}`** (origem: SPEC-20260522-1000, 2026-05-22 10:15) — Divergência do main.md original ("Backend Express não toca"). Necessário pra portal consumir só conteúdo publicado/válido sem expor admin. Padrão de `PublicEventController`/`PublicPromotionController` separado dos admin controllers, com `Cache-Control` próprio e sem `requireAuth`.
- **Events usados como "notícias" no RSS** (origem: SPEC-20260522-1000, 2026-05-22 10:30) — Não há entity `News` separada no domínio. Events tem `title/summary/publishedAt/slug` que encaixam no RSS item. Trade-off: confunde semanticamente "evento agendado" com "notícia"; quando News entity nascer (SPEC futura), separar.
- **Invalidação por TTL natural, não trigger ativo** (origem: SPEC-20260522-1000, 2026-05-25 14:00) — Webhook portal `POST /internal/revalidate?tag=...` adiciona complexidade (shared secret, endpoint, trigger nos services do backend) para um caso de uso onde 1h de staleness é aceitável. Reavaliar quando publicação imediata em sitemap virar requisito de negócio.
- **`X-Forwarded-Host` no fetch portal→backend (não `Host`)** (origem: alinhado com [[tenant-resolution]], 2026-05-22 10:30) — Mesma armadilha do `loadTheme`: undici reescreve `Host` da URL. `X-Forwarded-Host` + `trust proxy=true` no backend resolve tenant corretamente.
- **Sitemap inclui só entities com `slug`** (origem: SPEC-20260522-1000, 2026-05-25 14:00) — Theater fora porque `TheaterShow` não tem coluna `slug`. Services fora porque entity não existe. Aceitar entrega parcial em vez de criar slug ad-hoc ou usar `id` (URL feia + SEO ruim). Future SPEC adiciona `show_slug` quando teatro virar prioridade.

## Alternativas consideradas e rejeitadas

- **Redis literal com ioredis no portal** (rejeitada em SPEC-20260522-1000, 2026-05-25 14:00) — main.md pedia. Trade-off: client extra no portal, conexão por instância, lifecycle compartilhado com Next. `unstable_cache` resolve o caso de uso "cache TTL 1h por tenant" sem nova dep nem complexidade de connection pooling.
- **Sitemap monolítico (sem cache)** (rejeitada em SPEC-20260522-1000, 2026-05-22 10:30) — cada GET dispara 3 fetches ao backend. Crawlers do Google batem em rajadas; sem cache, cada bate ia executar query no DB.
- **Theater no sitemap usando `id` em vez de `slug`** (rejeitada em SPEC-20260522-1000, 2026-05-25 14:00) — UUIDs em URL pública prejudicam SEO e UX. Melhor pular teatro do sitemap nesta versão e abrir SPEC pra adicionar `show_slug` corretamente.
- **News entity nova só pra alimentar o RSS** (rejeitada em SPEC-20260522-1000, 2026-05-22 10:30) — fora de escopo desta SPEC. Events cobre o caso até virar requisito explícito separar.
- **Invalidação via Redis pub/sub backend↔portal** (rejeitada em SPEC-20260522-1000, 2026-05-25 14:00) — overkill pra TTL de 1h. Webhook HTTP é mais simples se virar requisito.

## Gotchas

- **Cache miss multi-réplica** (2026-05-25 14:00, SPEC-20260522-1000) — `unstable_cache` é por instância do Next; rodar 2 réplicas significa 2 TTLs independentes (cada uma faz 1 hit no backend por hora). Aceitável até deploy multi-réplica virar gargalo; quando virar, reavaliar Redis ou cache distribuído.
- **`X-Forwarded-Host` obrigatório no fetch portal→backend** (2026-05-22 10:30, SPEC-20260522-1000) — sem ele, undici reescreve `Host` e backend vê `localhost:3001` em vez do shopping. Tenant resolve falha. Mesmo gotcha de [[tenant-resolution]].
- **`escapeXml` ordem importa** (2026-05-22 10:15, SPEC-20260522-1000) — `&` deve ser substituído ANTES de `<`. Senão `<` vira `&lt;` e a próxima passada transforma o `&` em `&amp;lt;` (escape duplo). `lib/xml.ts` segue ordem correta.
- **RSS pubDate em RFC 822, não ISO 8601** (2026-05-22 10:30, SPEC-20260522-1000) — `Date.toUTCString()` retorna formato correto. ISO 8601 (`toISOString()`) quebra leitores de RSS.
- **Sitemap `<lastmod>` em ISO 8601 (sim, RFC 3339 também é aceito)** (2026-05-22 10:30, SPEC-20260522-1000) — sitemap.org spec aceita W3C Datetime que coincide com ISO 8601 yyyy-MM-dd. Helper `toIso8601Date` retorna só `yyyy-MM-dd`.
- **TheaterShow sem `slug`** (2026-05-25 14:00, SPEC-20260522-1000) — descoberto durante esta SPEC: entity foi modelada sem coluna slug. Bloqueia sitemap de `/teatro/{slug}`. Future SPEC.
- **Cache nunca é purgado em publish/archive** (2026-05-25 14:00, SPEC-20260522-1000) — só TTL 1h. Se admin publica notícia e quer ver no sitemap imediatamente, precisa esperar até 1h. Future SPEC cobre invalidação ativa via `revalidateTag` + webhook.

## Estado congelado (se houver)

_(nenhum)_
