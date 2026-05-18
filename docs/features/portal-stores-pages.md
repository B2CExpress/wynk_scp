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

### Em execução (só em branches - não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

Feature iniciada para fechar a superfície pública do catálogo de lojas no `portal/`, sobre a base da API multitenant já existente no backend.

## Decisões arquiteturais ativas

- **SSR via Next.js App Router em `portal/src/app/lojas/`** (origem: SPEC-20260516-1730, 2026-05-16) — `page.tsx` usa `searchParams` async (App Router moderno); detalhe usa `params: Promise<{slug: string}>`. SEO + tenant theme via flavors carregados server-side.
- **Tenant resolvido por `headers().get('host')` + `X-Forwarded-Host` no fetch ao backend** (origem: SPEC-20260516-1730, 2026-05-16) — segue o padrão de `tenant-resolution` (undici reescreve `Host` no fetch interno, daí `X-Forwarded-Host` explícito). `resolveTenantByHost` no portal consulta `GET /tenant/resolve`.
- **Descrição renderizada via `dangerouslySetInnerHTML`** (origem: SPEC-20260516-1730, 2026-05-16) — `description` já chega sanitizada do backend (allowlist `sanitize-html` em `admin-stores-crud`). Defense-in-depth no portal seria sanitizar de novo; por ora não foi feito — dívida técnica registrada.
- **`opening_hours` exibido como JSON cru em `<pre>`** (origem: SPEC-20260516-1730, 2026-05-16) — placeholder funcional; UI dedicada (dias da semana + horários) fica pra SPEC futura quando o backoffice publicar formato estruturado.
- **Imagens via `next/image` com `unoptimized`** (origem: SPEC-20260516-1730, 2026-05-16) — URLs vindas do storage stub (`/uploads/...`) não são domínios reais; quando upload real entrar (Fase 6), trocar pra otimização Next.
