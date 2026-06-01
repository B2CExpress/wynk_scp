# Feature: portal-stores-pages

**Keywords:** portal, stores, lojas, nextjs, filtros, busca, detalhe
**Arquivos principais:**
  - portal/src/app/lojas/page.tsx
  - portal/src/app/lojas/[slug]/page.tsx
  - portal/src/lib/stores/api.ts
**Resumo:** Páginas públicas do catálogo de lojas no portal Next.js. Consomem a API multitenant do backend via SSR usando `X-Forwarded-Host`, exibindo listagem com filtros e detalhe completo da loja.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260516-1730 | 2026-05-18 | `8aef2da` | Catálogo de lojas - fase 2 pública e operacional |
| SPEC-20260601-1909 | 2026-06-01 | `eb9c23c` | Páginas públicas de conteúdo no portal (eventos/notícias/promoções/serviços/teatro + home), mock-driven |

### Em execução (só em branches - não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

Feature iniciada para fechar a superfície pública do catálogo de lojas no `portal/`, sobre a base da API multitenant já existente no backend.

Escopo ampliado (SPEC-20260601-1909) para cobrir as demais páginas públicas de conteúdo do portal, todas em `portal/src/app/`:
- **lojas** (`/lojas`) — catálogo real via `lib/stores/api.ts` (API multitenant).
- **eventos, notícias, promoções, serviços, teatro** (`/<rota>` + `/<rota>/[slug]`) — lista + detalhe, **mock-driven** via `portal/src/lib/<resource>/api.ts` (formato do contrato real, swap trivial). Eventos/promoções têm API pública no backend; notícias/teatro só têm admin; serviços não existe no domínio.
- **home** (`/`) — hero + `BannerCarousel` (client, self-contained) + seções (lojas/promoções/eventos/notícias), mock via `lib/home/api.ts`.

Convenção: server components async, CSS Modules (`content.module.css` compartilhado + `home.module.css`) sobre as theme vars do layout raiz, `next/image` `unoptimized`, detalhe com `notFound()`.

> Última atualização: 2026-06-01 19:59 (SPEC-20260601-1909)

## Decisões arquiteturais ativas

- **SSR via Next.js App Router em `portal/src/app/lojas/`** (origem: SPEC-20260516-1730, 2026-05-16) — `page.tsx` usa `searchParams` async (App Router moderno); detalhe usa `params: Promise<{slug: string}>`. SEO + tenant theme via flavors carregados server-side.
- **Tenant resolvido por `headers().get('host')` + `X-Forwarded-Host` no fetch ao backend** (origem: SPEC-20260516-1730, 2026-05-16) — segue o padrão de `tenant-resolution` (undici reescreve `Host` no fetch interno, daí `X-Forwarded-Host` explícito). `resolveTenantByHost` no portal consulta `GET /tenant/resolve`.
- **Descrição renderizada via `dangerouslySetInnerHTML`** (origem: SPEC-20260516-1730, 2026-05-16) — `description` já chega sanitizada do backend (allowlist `sanitize-html` em `admin-stores-crud`). Defense-in-depth no portal seria sanitizar de novo; por ora não foi feito — dívida técnica registrada.
- **`opening_hours` exibido como JSON cru em `<pre>`** (origem: SPEC-20260516-1730, 2026-05-16) — placeholder funcional; UI dedicada (dias da semana + horários) fica pra SPEC futura quando o backoffice publicar formato estruturado.
- **Imagens via `next/image` com `unoptimized`** (origem: SPEC-20260516-1730, 2026-05-16) — URLs vindas do storage stub (`/uploads/...`) não são domínios reais; quando upload real entrar (Fase 6), trocar pra otimização Next.
- **Páginas de conteúdo mock-driven via `lib/<resource>/api.ts`** (origem: SPEC-20260601-1909, 2026-06-01 19:59) — eventos/notícias/promoções/serviços/teatro consomem mocks no formato do contrato real (`_host` reservado), no padrão de `lib/stores/api.ts`. Decisão: validar visual sem depender do backend; swap para fetch real é trocar o corpo da função. Trade-off: dados não refletem o backend até a SPEC de integração.
- **`BannerCarousel`/`Countdown` self-contained** (origem: SPEC-20260601-1909, 2026-06-01 19:59) — sem dependência externa (Next 16 não traz carousel); estado + `setInterval`. `Countdown` defere o tick inicial via `setTimeout` para não violar `react-hooks/set-state-in-effect`.

## Gotchas

- **Notícias/teatro sem API pública; serviços não existe no backend** (2026-06-01 19:59, SPEC-20260601-1909) — só eventos (`/api/v1/events`) e promoções (`/api/v1/promotions`, sem detalhe) têm endpoint público. As páginas de notícias/teatro/serviços do portal são 100% mock até o backend expor as rotas (serviços exigiria criar o domínio do zero). Ao ligar a API real, ajustar `lib/<resource>/api.ts` e remodelar tipos conforme o DTO real.
- **`@/` no portal = `portal/src/`** (2026-06-01 19:59, SPEC-20260601-1909) — mas as páginas seguem o padrão das lojas e usam imports relativos (`../../lib/...`). Manter o mesmo estilo ao adicionar páginas.
