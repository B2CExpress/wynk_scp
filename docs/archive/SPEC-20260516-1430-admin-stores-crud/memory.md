# Memory — SPEC-20260516-1430-admin-stores-crud

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-16 14:30

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-18 (sessão #2 — arquivamento)
**Onde tô:** SPEC concluída e arquivada. CRUD admin completo entregue no commit `145f0cd` (sessão #1, Leonardo), validado no CI no commit `7642216` (sessão #2 pós-merge com main). 12/12 checks verdes; isolation tests (SPEC-20260514-2012) cobre os cenários cross-tenant dos endpoints desta SPEC.
**Próximo passo:** nenhum — SPEC em `archive/`. PR #15 stacked acima precisa de rebase quando o #14 mergear.
**Última decisão:** Migration `1746748500000` foi simplificada/renomeada pra só adicionar `external_url` e `opening_hours` — `description` foi removido por já existir na `1746748400000` (absorvida pelo PR #9 fulltext). Stub de storage continua dívida técnica explícita pra Fase 6.
**Bloqueio atual:** —
**Se retomar, ler:** entrada `[conclusão]` em `state.md` (2026-05-18) — caminho dos 2 commits da sessão #2 (merge + fix migration).

---

## Contexto ativo

### O que está sendo feito AGORA

CRUD admin completo de stores. 5 endpoints: listagem paginada (GET /api/admin/stores), detalhe (GET /:id), criar (POST), atualizar (PUT /:id com update de relações em transação), deletar (DELETE /:id). Validação rigorosa Zod, sanitização HTML via allowlist, slug auto-gerado, isolamento tenant em todas as queries, cache invalidation pós-mutação.

### Hipóteses em jogo

- **TypeORM `.transaction()` é a forma correta** (status: a validar). Need to check wynk_ecommerce backend para padrão. 2026-05-16 14:30
- **StoreRepository pode ser expandido vs criar novo** (status: a validar). Check structure em `backend/src/repositories/`. 2026-05-16 14:30

### Decisões recentes que importam pra continuar

- [2026-05-16 14:30] POST/PUT usam transação ACID: se qualquer operação falhar (ex.: category inexistente), tudo volta. Atomicidade é crítica.
- [2026-05-16 14:30] PUT sem `category_ids` no body não mexe nas relações (compatibilidade). PUT com `category_ids` = DELETE todas + INSERT novas.
- [2026-05-16 14:30] Slug auto-gerar se vazio, com `slugify` e regex validation `^[a-z0-9-]+$`.
- [2026-05-16 14:30] Isolamento: `withTenant()` em TODA query, 404 se outro tenant (nunca 403 pra evitar enumeração).

### Respostas-chave do usuário

_(nenhuma ainda, ativação inicial)_

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda)_

### Arquivos ativamente sendo tocados

_(nenhum ainda — iniciando)_

### Onde parei exatamente

Ativação. Próxima ação: ler Store entity schema + expandir repository com métodos de transação.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-16 14:30 | ~15min | ativação | SPEC criada, plano inicial, leitura de contexto (SPEC-1400 + SPEC-2012) |
