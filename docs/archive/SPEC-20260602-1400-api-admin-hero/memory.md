# Memory — SPEC-20260602-1400

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-06-02 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 13:55 (sessão #2 — re-escopo + conclusão)
**Onde tô:** SPEC CONCLUÍDA e arquivada. Hero implementado no backend Express+TypeORM (commit `57190fe`), tudo verde (117 testes). Features-fantasma removidas, editorial-content atualizada.
**Próximo passo:** nenhum. Futuro: endpoint público `GET /api/v1/hero`, UI no backoffice, render do hero na home.
**Última decisão:** singleton por tenant via upsert; `overlay_opacity` numeric(4,2) com transformer; `requireAuth` real; sem Zod.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** entrada `[conclusão]` (2026-06-02 13:55) no state.md.

> SPEC concluída em 2026-06-02 13:55, commit `57190fe`.

---

## Contexto ativo

### O que está sendo feito AGORA

Implementação da API admin de hero no portal Next.js (App Router). Dois endpoints: `GET /api/admin/hero` (retorna hero do tenant ou defaults) e `PUT /api/admin/hero` (UPSERT com Zod + invalidação de cache).

Sessão 1 gerou todos os arquivos. O principal bloqueio pendente é auth: `getAdminSession` é um stub que retorna `null`, fazendo os endpoints responderem 401. Quando a SPEC de auth do portal for implementada, basta preencher o `TODO` em `lib/auth/session.ts`.

A tabela `tenant_hero` precisa ser criada no banco via migration SQL antes dos testes.

### Hipóteses em jogo

- **Features `admin-content-api` e `portal-home` não existem em `docs/features/`** (status: não validada). Se não existirem, precisam ser criadas (R.4). Validar com dev.

### Decisões recentes que importam pra continuar

- [2026-06-02 14:00] UPSERT via `onConflictDoUpdate` — constraint `UNIQUE(tenant_id)` na tabela é o target do conflict.
- [2026-06-02 14:00] GET retorna `HERO_DEFAULTS` (constante em `lib/validators/hero.ts`) quando não existe linha no banco — nunca 404.
- [2026-06-02 14:00] `overlay_opacity` é `NUMERIC(4,2)` no banco, `number` no JSON.
- [2026-06-02 14:00] `tenant_id` sempre da sessão — payload do body não pode sobrescrever (cross-tenant blindado).

### Respostas-chave do usuário

- [2026-06-02 14:00] Usuário forneceu spec completa com pseudocódigo, validações campo-a-campo e critérios de aceite literais. Nenhuma ambiguidade de escopo.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma na sessão 1)_

### Arquivos ativamente sendo tocados

- `portal/src/app/api/admin/hero/route.ts` (criado)
- `portal/src/lib/validators/hero.ts` (criado)
- `portal/src/lib/db/schema.ts` (criado)
- `portal/src/lib/db/index.ts` (criado)
- `portal/src/lib/auth/session.ts` (criado — stub)
- `portal/src/lib/db/migrations/0001_create_tenant_hero.sql` (criado)

### Onde parei exatamente

Fim da sessão 1. Todos os arquivos gerados e entregues ao dev. Próxima sessão começa com:
1. Confirmar se features `admin-content-api` e `portal-home` existem em `docs/features/` — se não, criar stubs
2. `npm install zod -w portal`
3. Rodar `0001_create_tenant_hero.sql` (requer Docker)
4. Testar manualmente: PUT cria, PUT atualiza (SELECT mantém 1 linha), GET sem hero retorna defaults, PUT com `overlay_opacity: 2.5` retorna 400
5. Quando auth SPEC estiver ativa, preencher `TODO` em `lib/auth/session.ts`

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-06-02 14:00 | ~30min | ativação | Criação de todos os arquivos de código + docs SPEC |