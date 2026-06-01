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
_(nenhuma — feature nova)_

### Planejadas (future/)
_(nenhuma planejada)_

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260531-1400 | Admin Dashboard com Métricas do Tenant | feature/SQU-67-dashboard-com-metricas-do-tenant |

## Estado atual

Backend: Service com aggregação de 5 contadores via `Promise.all`, cache Redis (chave `dashboard:{tenantId}`, TTL 60s), autenticação + autorização. Endpoint `GET /api/admin/dashboard/metrics` retorna JSON com stores (total/ativas), events (upcoming), posts (30d), newsletter (0 — stub), promotions (ativas), GA4 (condicional).

Frontend: Page AdminDashboard renderiza 7 cards em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile). Componente MetricCard reutilizável com loading/erro/retry. Fetch com credentials. Refresh automático a cada 60s.

> Última atualização: 2026-05-31 14:30 (SPEC-20260531-1400)

## Decisões arquiteturais ativas

_(nenhuma ainda)_

## Alternativas consideradas e rejeitadas

_(nenhuma ainda)_

## Gotchas

_(nenhum ainda)_

## Estado congelado (se houver)

_(nenhum)_
