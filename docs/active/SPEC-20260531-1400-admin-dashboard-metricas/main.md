# SPEC-20260531-1400: Dashboard Admin com Métricas do Tenant

**Status:** done
**Criada:** 2026-05-31 14:00
**Ativada:** 2026-05-31 14:00
**Concluída:** 2026-05-31 14:35
**Commit final:** `e69e043`
**Keywords:** dashboard, métricas, admin, cache, tenant
**Features:** admin-dashboard
**Branch:** feature/SQU-67-dashboard-com-metricas-do-tenant
**Depende de:** —
**Origem:** requisição do usuário em 2026-05-31 14:00
**Resumo:** Implementar página `/admin` (dashboard) que exiba métricas agregadas do tenant em cards: lojas (total e ativas), eventos agendados, posts publicados (30d), inscritos na newsletter, promoções ativas, e opcionalmente GA4. Endpoint `GET /api/admin/dashboard/metrics` agrega dados com cache Redis de 60s.

## Objetivo

Fornecer primeira impressão visual do estado da plataforma ao admin fazer login. Decidir rapidamente o que fazer hoje (publicar notícia, atualizar destaques, etc.). Agregação em uma única chamada API para evitar waterfall de requisições.

## Escopo

**DENTRO:**
- Endpoint `GET /api/admin/dashboard/metrics` retornando JSON com 6-7 métricas
- Queries paralelas via `Promise.all` (não serial) para 5 contadores básicos
- Chamada opcional a GA4 API com timeout de 3s (não bloqueia)
- Cache Redis: chave `dashboard:{tenantId}`, TTL 60s
- Isolamento de tenant (métricas nunca vazam entre tenants)
- Autenticação: role IN `['editor', 'tenant_admin', 'superadmin']` (403 caso contrário)
- Página React `/admin` renderizando 6 cards em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
- Card GA4 só aparece se `ga4_property_id` configurado em `tenant.config`
- Erro em GA4 não quebra página: card mostra mensagem amigável + retry
- Componente reutilizável `MetricCard.tsx`

**FORA:**
- Edição de métricas (só leitura)
- Integração com GA4 real (mock/stub é ok para testes)
- Drill-down (clicar no card não leva a lista detalhada — apenas view)
- Notificações ou alerts de anomalias
- Autoinvalidação de cache (apenas TTL)

## Implementação

### Arquitetura

Backend:
- `backend/src/controllers/admin-dashboard.controller.ts` — controller com método `getMetrics()`
- `backend/src/services/admin-dashboard.service.ts` — service que:
  - Faz `Promise.all([counts de lojas, eventos, posts, newsletter, promos])`
  - Chama `fetchGA4Metrics()` com timeout de 3s (não bloqueia)
  - Monta resultado JSON
- `backend/src/routes/admin-dashboard.routes.ts` — rota `GET /api/admin/dashboard/metrics`
- `backend/src/utils/ga4.ts` — helper para GA4 (mock ou integração real)
- Middleware `requireAuth` + validação de role obrigatória

Frontend (Backoffice/React):
- `backoffice/src/pages/AdminDashboard.tsx` — page component (chamará endpoint)
- `backoffice/src/components/MetricCard.tsx` — componente de card reutilizável
- Fetch em useEffect, estado para loading/erro, retry manual para GA4

### Cache Redis

```
Chave: dashboard:{tenant_id}
TTL: 60 segundos
Estrutura: JSON stringificado
```

### Fluxo de requisição

1. Usuário acessa `/admin`
2. React component monta, faz GET `/api/admin/dashboard/metrics`
3. Backend (controller):
   - Valida cookie (401 se falta)
   - Valida role (403 se não autorizado)
   - Monta `cacheKey = dashboard:{tenant.id}`
   - Tenta `redis.get(cacheKey)`
   - HIT: retorna resultado imediatamente
   - MISS: executa queries paralelas (Promise.all)
   - Se GA4 configurado: fetch GA4 com timeout 3s
   - Monta result JSON
   - `redis.setex(cacheKey, 60, JSON(result))`
   - Retorna 200 com JSON
4. React renderiza cards com dados

### Gotchas conhecidos

- **N+1 COUNT:** usar um único query com `COUNT(CASE WHEN ...)` ou similar, não queries separadas
- **GA4 delay:** timeout obrigatório de 3s, nunca síncrono
- **Tenant isolation:** chave **DEVE** incluir `tenant_id`, senão compartilha cache entre tenants
- **Postgres FILTER:** `COUNT(*) FILTER (WHERE ...)` é Postgres específico

## Critério de aceite

- [x] Endpoint `GET /api/admin/dashboard/metrics` implementado e retorna JSON correto (200) (2026-05-31 14:20)
- [x] Queries rodam em paralelo via `Promise.all` (verificar com logs) (2026-05-31 14:20)
- [x] Cache Redis funciona (chave por tenant, TTL 60s) (2026-05-31 14:20)
- [x] Autenticação 401, autorização 403 funcionam (2026-05-31 14:20)
- [x] Página `/admin` renderiza 6 cards com dados corretos (2026-05-31 14:30)
- [x] Card GA4 só aparece se configurado (2026-05-31 14:30)
- [x] Erro em GA4 não quebra página (2026-05-31 14:30)
- [x] Isolamento: trocar tenant mostra métricas do novo tenant (2026-05-31 14:20 — implementado via requireTenantContext + withTenant em todas as queries)
- [x] **Features tocadas (admin-dashboard) atualizadas** com timestamp e referência a esta SPEC (2026-05-31 14:30)
- [x] `state.md` com entrada `[conclusão]` (2026-05-31 14:35)
- [x] `memory.md` com TL;DR final atualizado (2026-05-31 14:35)
