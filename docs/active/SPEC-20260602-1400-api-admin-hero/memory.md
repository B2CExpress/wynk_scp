# Memory — SPEC-20260602-1400

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-06-02 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 13:40 (sessão #2 — re-escopo)
**Onde tô:** SPEC re-escopada (Next/Drizzle → Express+TypeORM) e desarquivada. Os scaffolds Drizzle da sessão 1 são descartados (nunca commitados). Implementação real no backend começando.
**Próximo passo:** entity `Hero` (`tb_hero`, unique `tenant_id`) + migration + DTO manual + repo (upsert) + service (defaults no GET) + controller + routes (`requireAuth`) + wiring + testes.
**Última decisão:** re-escopo pro backend Express (igual popup/banner); singleton por tenant via upsert; `requireAuth` real; sem Zod (DTO manual).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** `[MARCO] [decisão] re-escopo` (2026-06-02 13:40) no state.md.

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