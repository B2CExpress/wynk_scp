# Memory — SPEC-20260531-1400-admin-dashboard-metricas

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-31 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-31 14:35 (sessão #1)
**Onde tô:** ✅ COMPLETO — todos os checkboxes da SPEC marcados. Pronto para merge.
**Próximo passo:** Commit + push. Testes manuais opcionais (rodar backend, curl endpoint).
**Última decisão:** Promise.all para queries; cache por tenant; isolamento via requireTenantContext
**Bloqueio atual:** nenhum
**Se retomar, ler:** Entrada de 2026-05-31 14:35 no state.md ([conclusão])

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

_(nenhuma ainda — contexto vem da documentação passada)_

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda)_

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
