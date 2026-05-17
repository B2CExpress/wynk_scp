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
| _(nenhuma ainda)_ | — | — | — |

### Em execução (só em branches - não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260516-1730 | Catálogo de lojas - fase 2 pública e operacional | feature/store-catalog-phase-2 |

## Estado atual

Feature iniciada para fechar a superfície pública do catálogo de lojas no `portal/`, sobre a base da API multitenant já existente no backend.
