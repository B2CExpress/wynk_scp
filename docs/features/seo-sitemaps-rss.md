# Feature: SEO - Sitemaps e RSS

**Keywords:** SEO, sitemap.xml, RSS feed, indexação, discoverability
**Arquivos principais:**
  - app/sitemap.xml/route.ts
  - app/rss/news.xml/route.ts
  - app/robots.txt/route.ts
  - lib/xml.ts
**Resumo:** Endpoints XML para SEO: sitemap.xml com todas URLs públicas, rss/news.xml com últimas 50 notícias, robots.txt apontando para sitemap. Cache 1h, isolamento por tenant, escapamento de entidades XML.

## Specs desta feature

### Concluídas
_(nenhuma ainda)_

### Planejadas (future/)
_(nenhuma)_

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260522-1000 | Sitemap XML + RSS feed + robots.txt | feature/SQU-55-sitemap-dinamico-e-rss |

## Estado atual

**Não implementado ainda.** Estrutura planejada:

- **app/sitemap.xml/route.ts**: Endpoint GET que retorna XML com todas URLs públicas (estáticas + dinâmicas de lojas, notícias, eventos, teatro, promoções, serviços).
- **app/rss/news.xml/route.ts**: Endpoint GET que retorna RSS 2.0 com últimas 50 notícias publicadas em formato RFC 822.
- **app/robots.txt/route.ts**: Endpoint GET que retorna robots.txt padrão permitindo mecanismos de busca, apontando para sitemap.
- **lib/xml.ts**: Helper para escapar entidades XML (< > & ' ") evitando quebra de parsers.
- **Cache Redis**: TTL 1h com chaves `sitemap:{tenant_id}` e `rss:news:{tenant_id}`.
- **Invalidação**: Cache invalidado em publish/archive de qualquer conteúdo (news, events, theater, promotions, services, stores).
- **Head layout**: Link alternativo RSS adicionado ao `<head>` do layout principal.

> Última atualização: 2026-05-22 10:00 (SPEC-20260522-1000)

## Decisões arquiteturais ativas

_(nenhuma ainda)_

## Alternativas consideradas e rejeitadas

_(nenhuma ainda)_

## Gotchas

_(nenhuma ainda)_

## Estado congelado

Não há zonas protegidas inicialmente. Qualquer arquivo tocado pode ser modificado.
