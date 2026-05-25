# SPEC-20260522-1000: Sitemap XML + RSS feed + robots.txt

**Status:** done
**Criada:** 2026-05-22 10:00
**Ativada:** 2026-05-22 10:00
**Concluída:** 2026-05-25 14:30
**Commit final:** _(commit pendente)_
**Keywords:** SEO, XML, sitemap, RSS, robots, cache, tenant-isolation
**Features:** seo-sitemaps-rss
**Branch:** feature/SQU-55-sitemap-dinamico-e-rss
**Depende de:** (nenhuma)
**Origem:** usuário em 2026-05-22 10:00
**Resumo:** Implementar endpoints /sitemap.xml, /rss/news.xml, /robots.txt com geração dinâmica, cache 1h, isolamento por tenant, escapamento XML correto.

## Objetivo

Melhorar SEO de cada tenant: Google indexa todas URLs públicas via sitemap, usuários descobrem notícias via RSS reader. Cache 1h reduz carga no DB. Cada tenant vê apenas seu próprio conteúdo.

## Escopo

**DENTRO:**
- Endpoint GET /sitemap.xml: XML com todas URLs públicas (estáticas + dinâmicas)
- Endpoint GET /rss/news.xml: RSS 2.0 com últimas 50 notícias publicadas
- Endpoint GET /robots.txt: robots.txt padrão apontando para sitemap
- Helper lib/xml.ts para escapar entidades XML
- Cache Redis com TTL 1h (chaves: sitemap:{tenant_id}, rss:news:{tenant_id})
- Invalidação de cache em publish/archive de conteúdo
- Link <link rel='alternate' type='application/rss+xml'> no <head> do layout
- Content-Type correto (application/xml, application/rss+xml, text/plain)
- Isolamento por tenant (cada tenant vê apenas seu conteúdo)
- Caracteres especiais escapados (< > & ' ")

**FORA:**
- Sitemaps de categorias, tags, filtros (apenas URLs de entidades principais)
- Submissão automática a Google, Bing
- Validação externa em serviços third-party (manual apenas)
- Notificação de novas entradas no RSS (apenas feed passivo)
- Video sitemap, image sitemap (apenas URLs de páginas)
- **Theater shows no sitemap** (descoberto durante implementação): `TheaterShow` entity não tem coluna `slug`, sem ela não há URL pública canônica. Fica pra SPEC follow-up adicionar `show_slug` + migration.
- **Services no sitemap**: entity `Service` ainda não existe no domínio; sitemap-completo de serviços pressupõe SPEC nova que crie a entity.
- **Invalidação ativa em publish/archive**: implementada apenas por TTL natural (1h). Webhook backend→portal para invalidação imediata fica em SPEC follow-up se virar requisito.

## Implementação

### Arquitetura

1. **Backend (Express)** não toca — tudo é Next.js Portal (SSR)
2. **Route handlers** no Portal (Next.js App Router):
   - `app/sitemap.xml/route.ts` → GET /sitemap.xml
   - `app/rss/news.xml/route.ts` → GET /rss/news.xml
   - `app/robots.txt/route.ts` → GET /robots.txt

3. **Fluxo de resolução de tenant:**
   - `getCurrentTenant()` via middleware existente (portal já faz isso em layout.tsx)
   - `baseUrl = https://${tenant.host}`

4. **Queries ao backend:**
   - GET /stores (status=active)
   - GET /news (status=published)
   - GET /events (status=published)
   - GET /theater-shows (status=published)
   - GET /promotions (status=published, valid_until >= now)
   - GET /services (status=active)

5. **Cache:**
   - Redis (ioredis, já integrado no backend)
   - Chaves: `sitemap:{tenant_id}`, `rss:news:{tenant_id}`
   - TTL: 3600s (1h)
   - Invalidação: subscriber ou endpoint que limpa cache ao publicar/arquivar

6. **Escapamento XML:**
   - Caracteres: < > & ' "
   - Helper `escapeXml(str: string): string` em lib/xml.ts

### URLs a incluir no sitemap

**Estáticas (sempre):**
- `/`
- `/lojas`
- `/noticias`
- `/eventos`
- `/teatro`
- `/promocoes`
- `/servicos`

**Dinâmicas (por entidade):**
- `/lojas/{store.slug}` (status=active)
- `/noticias/{news.slug}` (status=published)
- `/eventos/{event.slug}` (status=published)
- `/teatro/{theater.slug}` (status=published)
- `/promocoes/{promo.slug}` (status=published, valid_until >= now)
- `/servicos/{service.slug}` (status=active)

### RSS: últimas 50 notícias

- Ordenar: published_at DESC
- Limit: 50
- Filtro: status=published, published_at <= now

### Content-Type e headers

| Endpoint | Content-Type | Cache-Control |
|---|---|---|
| /sitemap.xml | application/xml | public, max-age=3600 |
| /rss/news.xml | application/rss+xml | public, max-age=3600 |
| /robots.txt | text/plain | public, max-age=3600 |

### Validação de XML

- Sitemap: RFC 3986 compliance, namespace sitemaps.org
- RSS: RSS 2.0 spec, RFC 822 dates

### Gotchas conhecidas

- **Datas em RFC 822 no RSS** (não ISO 8601): `Wed, 22 May 2026 10:00:00 +0000`
- **Content-Type crítico**: browser renderiza como HTML se errado, quebra validadores
- **Escapamento XML**: & deve vir primeiro (`&amp;` antes de `&lt;`)
- **Tenant.host com protocolo**: sempre https:// em produção
- **Status filtering**: incluir apenas publicado (news, events, theater, promo) ou ativo (stores, services)
- **Promoções com valid_until**: incluir apenas se still valid

### Arquivo sugerido: lib/xml.ts

```typescript
export function escapeXml(str: string): string {
  // Ordem importante: & DEVE ser primeiro
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}

export function toRfc822(date: Date): string {
  // Exemplo: Wed, 22 May 2026 10:00:00 +0000
  return date.toUTCString();
}
```

## Critério de aceite

- [x] Endpoint GET /sitemap.xml retorna XML válido (application/xml) (2026-05-22 10:30, commit `6f66a1c`)
- [x] Sitemap inclui URLs públicas: 7 estáticas + dinâmicas de stores, events, promotions (2026-05-25 14:00, commit pendente) — theater/services ficaram FORA conforme escopo ajustado
- [ ] Sitemap valida em https://www.xml-sitemaps.com/validate-xml-sitemap.html — validação externa manual ainda não feita
- [x] Endpoint GET /rss/news.xml retorna RSS 2.0 válido (application/rss+xml) (2026-05-22 10:45, commit `6f66a1c`)
- [x] RSS inclui últimas 50 notícias com pub-date em RFC 822 (2026-05-22 10:45, commit `6f66a1c`) — events usados como "notícias" (sem entity News separada, decisão registrada)
- [ ] RSS valida em https://validator.w3.org/feed/ — validação externa manual ainda não feita
- [x] Endpoint GET /robots.txt retorna texto com User-agent, Allow, Disallow, Sitemap (2026-05-22 10:45, commit `6f66a1c`)
- [x] robots.txt aponta para sitemap correto do tenant (`https://{host}/sitemap.xml`) (2026-05-22 10:45, commit `6f66a1c`)
- [x] Escapamento XML correto via `lib/xml.ts:escapeXml` (ordem `&` antes de `<` etc.) (2026-05-22 10:30, commit `6f66a1c`)
- [x] **Cache server-side via `unstable_cache` do Next.js** (revalidate 3600s, tags `sitemap:{tenant_id}`, `rss:news:{tenant_id}`, `robots:{tenant_id}`) (2026-05-25 14:00, commit pendente) — substituiu Redis literal (decisão registrada em seo-sitemaps-rss.md)
- [x] Isolamento por tenant: 404 se host não resolve em `resolveTenantByHost`; queries ao backend passam `X-Forwarded-Host` (2026-05-22 10:30, commit `6f66a1c`)
- [x] Content-Type correto: application/xml, application/rss+xml, text/plain (2026-05-22 10:30, commit `6f66a1c`)
- [ ] ~~Cache invalidado em publish/archive~~ — **NÃO IMPLEMENTADO** nesta entrega; coberto por TTL natural de 1h. Tags do `unstable_cache` deixam abertura pra `revalidateTag` via webhook se virar requisito (SPEC follow-up).
- [x] Link RSS adicionado ao `<head>` do layout (`rel='alternate' type='application/rss+xml'`) (2026-05-22 10:30, commit `6f66a1c`)
- [x] **Features tocadas (seo-sitemaps-rss) atualizadas** com timestamp e referência a esta SPEC (2026-05-25 14:30, commit pendente)
- [x] `state.md` com entrada `[conclusão]` (2026-05-25 14:30, commit pendente)
- [x] `memory.md` com TL;DR final atualizado (2026-05-25 14:30, commit pendente)

