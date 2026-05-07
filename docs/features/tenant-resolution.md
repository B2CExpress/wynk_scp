# Feature: tenant-resolution

**Keywords:** tenant, multitenant, middleware, host, routing, Next.js
**Arquivos principais:**
  - middleware.ts
  - lib/tenant.ts
  - app/tenant-not-found/page.tsx
**Resumo:** Intercepta toda requisição do portal Next.js, resolve o tenant pelo header `Host` (ou fallback `X-Tenant-Slug` em dev), injeta `x-tenant-id` e `x-tenant-slug` nos headers para consumo por Server Components; redireciona para 404 customizado se tenant não encontrado ou inativo.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| — | — | — | — |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| — | — | — |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260506-1000 | Middleware de resolução de tenant | feature/tenant-resolution-middleware |

## Estado atual

_(não implementado — SPEC-20260506-1000 em execução)_

> Última atualização: 2026-05-06 10:00 (SPEC-20260506-1000)

## Decisões arquiteturais ativas

_(nenhuma ainda — a definir durante execução de SPEC-20260506-1000)_

## Alternativas consideradas e rejeitadas

_(nenhuma ainda)_

## Gotchas

_(nenhum ainda — ver armadilhas documentadas em SPEC-20260506-1000/main.md §Implementação)_

## Estado congelado (se houver)

_(nenhum)_