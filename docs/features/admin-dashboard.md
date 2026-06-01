# Feature: admin-dashboard

**Keywords:** dashboard, admin, métricas, tenant, cache
**Arquivos principais:**
  - backend/src/controllers/admin-dashboard.controller.ts
  - backend/src/services/admin-dashboard.service.ts
  - backend/src/routes/admin-dashboard.routes.ts
  - backoffice/src/pages/AdminDashboard.tsx
  - backoffice/src/components/MetricCard.tsx
**Resumo:** Dashboard inicial do admin exibindo métricas agregadas do tenant: lojas, eventos, posts, newsletter subscribers, promoções e GA4. Endpoint único com cache Redis (60s) e isolamento de tenant.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260531-1400 | 2026-06-01 | `52edc13` | Admin Dashboard com Métricas do Tenant |

### Planejadas (future/)
_(nenhuma planejada)_

### Em execução (só em branches — não aparece em main)
_(nenhuma)_

## Estado atual

Backend: Service com aggregação de 5 contadores via `Promise.all`, cache Redis (chave `dashboard:{tenantId}`, TTL 60s), autenticação + autorização. Endpoint `GET /api/admin/dashboard/metrics` retorna JSON com stores (total/ativas), events (upcoming), posts (30d), newsletter (0 — stub), promotions (ativas), GA4 (condicional).

Frontend: Page AdminDashboard renderiza 7 cards em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile). Componente MetricCard reutilizável com loading/erro/retry. Fetch com credentials. Refresh automático a cada 60s.

> Última atualização: 2026-06-01 18:45 (SPEC-20260531-1400)

## Decisões arquiteturais ativas

- **Escopo de tenant via `withTenant()`/ALS, não por parâmetro** (origem: SPEC-20260531-1400, 2026-06-01 18:45) — Os métodos de agregação do `AdminDashboardService` não recebem `tenantId`; o escopo vem do contexto de tenant (`AsyncLocalStorage`) lido por `withTenant()`. A chave de cache (`dashboard:{tenantId}`) usa o `tenantId` de `requireTenantContext()`. Trade-off: dependência implícita do contexto de request (não dá pra chamar o service fora do pipeline multitenant), em troca de evitar passar `tenantId` por toda a cadeia.

## Alternativas consideradas e rejeitadas

_(nenhuma ainda)_

## Gotchas

- **Novo controller em `AppDeps` precisa de stub nos DOIS helpers de teste** (2026-06-01 18:45, SPEC-20260531-1400) — `createAdminDashboardRoutes` acessa `controller.getMetrics` na montagem das rotas. Ao adicionar um controller obrigatório em `AppDeps`, é preciso stubá-lo em `backend/__tests__/helpers/mock-deps.ts` (e2e) **e** em `tests/helpers/setup.ts` (isolation tests) — senão `createApp` lança `Cannot read properties of undefined` e derruba e2e + isolation no CI.

## Estado congelado (se houver)

_(nenhum)_
