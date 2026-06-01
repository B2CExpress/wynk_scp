# Memory — SPEC-20260531-1400-admin-dashboard-metricas

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-31 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-01 18:45 (sessão #2)
**Onde tô:** ✅ SPEC CONCLUÍDA em 2026-06-01 18:45, commit `52edc13`, arquivada em `docs/archive/`. CI verde.
**Próximo passo:** nenhum — SPEC fechada. Push + merge da branch ficam com o dev.
**Última decisão:** Escopo de tenant via `withTenant()`/ALS (sem param `tenantId`); controller obrigatório em `AppDeps` exige stub nos 2 helpers de teste
**Bloqueio atual:** nenhum
**Se retomar, ler:** Entradas de 2026-06-01 no state.md ([conclusão])

---

## Contexto ativo

### O que está sendo feito AGORA

Backend e frontend implementados. Dashboard exibe 7 cards (lojas, eventos, posts, newsletter, promos, GA4 condicional + placeholder). Endpoint agregador com Promise.all + cache Redis 60s. Isolamento de tenant via chave do cache. API passa por autenticação + autorização (role IN editor/tenant_admin/superadmin).

### Hipóteses em jogo

- **GA4 opcional** (status: confirmada). Se não configurado, card simplesmente não aparece. Se falhar, não quebra a página — card mostra erro.
- **Queries paralelas** (status: confirmada). `Promise.all([...])` para não serializar 5 contadores.
- **Cache por tenant** (status: confirmada). Chave **deve** incluir `tenantId`, senão vazam dados.

### Decisões recentes que importam pra continuar

- [2026-05-31 14:00] Usar `Promise.all` para queries paralelas; não serializar. TTL cache: 60s.
- [2026-05-31 14:00] Card GA4 condicional: só renderiza se `ga4_property_id` existe em `tenant.config`.

### Respostas-chave do usuário

- [2026-06-01] Usuário: "Tudo certo, pode concluir a spec"
  Contexto: após os fixes de CI e confirmação do isolation verde no ambiente dele (Postgres na 5435). Autorizou o fechamento formal (R.7 + arquivamento).
- [2026-06-01] Usuário escolheu: 2 commits separados (dashboard vs regressão de stores) + NÃO fechar a SPEC no primeiro momento, só após CI verde.

### Tentativas que falharam (para NÃO repetir)

- [2026-06-01] Diagnóstico inicial atribuiu o isolation vermelho ao `orderBy` de `store.repository`. ERRADO — a causa era `dashboardController` faltando em `tests/helpers/setup.ts`. O `orderBy` era bug latente separado. Lição: o isolation falhava em `createApp` (setup), antes de qualquer query; ler o stack trace até o ponto real de falha antes de inferir a causa.
- [2026-06-01] `mock-deps.ts` (e2e) e `tests/helpers/setup.ts` (isolation) são DOIS helpers distintos que montam `AppDeps` de forma independente — corrigir só um deixa o outro vermelho.

### Arquivos ativamente sendo tocados

- `backend/src/services/admin-dashboard.service.ts` (concluído)
- `backend/src/controllers/admin-dashboard.controller.ts` (concluído)
- `backend/src/routes/admin-dashboard.routes.ts` (concluído)
- `backend/src/server.ts` (concluído — injeção)
- `backend/src/app.ts` (concluído — rotas)
- `backoffice/src/pages/AdminDashboard.tsx` (concluído)
- `backoffice/src/components/MetricCard.tsx` (concluído)

### Onde parei exatamente

Implementação pronta. Código está em files criados e modificações feitas em server.ts + app.ts. Próximo: rodar backend, testar endpoint com curl/Postman, verificar cache, rodar frontend e validar cards com dados reais.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-31 14:00 | 0.5h | ativação+implementação | SPEC criada, backend + frontend implementados |
| 2 | 2026-06-01 18:30 | 0.5h | continuidade+conclusão | Fixes de CI (lint/typecheck/test/format/isolation), conclusão e arquivamento |
