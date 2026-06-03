# Memory — SPEC-20260603-1149

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-06-03 12:16

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-03 17:58 (sessão #1)
**Onde tô:** Implementação COMPLETA — backend (CRUD+auth+testes, 146 verdes) + UI backoffice (`TenantsPage` reescrita, build verde). Migration NÃO rodada; NADA commitado.
**Próximo passo:** conclusão R.5.3+R.7 — atualizar 3 features, marcar aceite, commitar, arquivar (mesmo PR). Aguarda dev (commit + migration).
**Última decisão:** auth superadmin opção (a); posts_count=notícias.
**Bloqueio atual:** conclusão precisa de commits (R.6) + migration rodada.
**Se retomar, ler:** `state.md` — entrada de 2026-06-03 17:58 + tabela de fases.

---

## Contexto ativo

### O que está sendo feito AGORA

Ativação da SPEC. Objetivo da entrega: dar ao Superadmin um CRUD de tenants (API Express + tela backoffice) para provisionar shoppings em minutos, substituindo SQL/seed manual. O ponto mais sensível é que **o material de origem (Next.js) assume um schema que não existe** — a maior parte do trabalho inicial é reconciliar com a base real (migration + identidade superadmin).

### Hipóteses em jogo

- **Índice único `(tenant_id, email)` vira furo com tenant_id nullable** (status: a validar) — pode precisar de índice parcial para superadmin. 2026-06-03 12:16
- **`posts_count` = notícias (+ eventos?)** (status: a validar com def. do dashboard). 2026-06-03 12:16

### Decisões recentes que importam pra continuar

- [2026-06-03 11:49] Branding via `flavor_slug` opcional (default `'default'`), nunca cores no banco. Preserva Modelo A.
- [2026-06-03 11:49] Superadmin = papel em `tb_user` com `tenant_id` nullable. Rejeitada tabela separada.
- [2026-06-03 12:16] Começar pela migration — nada grava status/soft-delete sem ela.

### Respostas-chave do usuário

- [2026-06-03 11:49] Usuário: "1 - Branding via flavor_slug / 2 - papel superadmin com tenant_id nullable na própria tb_user"
  Contexto: escolha entre reconciliar com Modelo A vs. cores no banco, e entre papel em tb_user vs. tabela `tb_superadmin` separada.
- [2026-06-03 11:40] Usuário pediu a SPEC "lembrando que estamos utilizando express, não [Next.js]" — material de origem estava em formato Next, traduzido para Express+TypeORM.

### Tentativas que falharam (para NÃO repetir)

_nenhuma ainda_

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260603-1149-superadmin-crud-tenants/{main,state,memory}.md` (criados nesta sessão)
- A tocar na Fase 1: `backend/src/migrations/`, `backend/src/entities/Tenant.ts`, `backend/src/entities/User.ts`

### Onde parei exatamente

Fase 1 escrita: `migrations/1747104000000-AddTenantStatusAndSoftDelete.ts`, `entities/Tenant.ts` (+status,+deletedAt), `entities/User.ts` (tenantId nullable), 3 fixtures de teste ajustadas. Typecheck backend verde. Próxima ação concreta: dev roda `npm run migration:run -w backend`; depois criar `middleware/require-superadmin.ts` espelhando `require-tenant-admin.ts` (aceitar só `superadmin`).

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-06-03 11:40 | — | criação + ativação | Criou SPEC (traduzindo material Next→Express), reconciliou 5 descasamentos, validou 2 decisões, ativou |
