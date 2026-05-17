# Memory — SPEC-20260516-1430-admin-stores-crud

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-16 14:30

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-16 14:30 (sessão #1)
**Onde tô:** Ativação — plano inicial feito, leitura de SPECs anteriores concluída
**Próximo passo:** Ler schema Store entity + começar validators Zod + sanitize lib
**Última decisão:** Transação em POST (INSERT store + category relations) e PUT (DELETE + reINSERT relações)
**Bloqueio atual:** nenhum
**Se retomar, ler:** State.md seção [ativação] + schema existente em SPEC-1400

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
