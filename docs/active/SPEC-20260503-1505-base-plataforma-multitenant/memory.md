# Memory — SPEC-20260503-1505

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 17:42 (sessão #1)
**Onde tô:** **Fase 2 fechada.** Postgres+Redis rodando, schema `scp` criado, migrations aplicadas, entity Tenant funcional, tenant context propagável, subscriber TypeORM enforçando `tenant_id`. Backend conecta no DB e responde `/health`. 6/6 testes passam.
**Próximo passo:** Fase 3 — endpoint `GET /tenant/resolve` (host → tenant), cache Redis em `tenant:resolve:{host}` (TTL 10 min), middleware `resolveTenantByHost` antes do `tenantContextMiddleware`, invalidação ao mudar host/flavor_slug, testes E2E.
**Última decisão:** Postgres 15 alinhado com wynk_ecommerce (não 16). Portas 5435/6382 (evitar conflito com 5434/6381 do wynk_ecommerce). Pre-script `ensure-schema.ts` resolve chicken-and-egg do TypeORM ao criar tabela `migrations`. Subscriber rejeita UPDATE em `tenantId` mesmo que match — exige operação explícita pra cross-tenant move.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** state.md TL;DR + entrada `[conclusão] Fase 2` (17:42).

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão de **ativação** da SPEC-1505 (base da plataforma multitenant). Repositório está praticamente vazio fora de `docs/`. O objetivo é entregar a fundação ponta-a-ponta para 1 tenant: schema com `tenant_id`, resolução por host, cache Redis, layout raiz com CSS vars do tenant, JWT + refresh, seed.

Sessão de ativação fechou com:
1. Movimentação `future/` → `active/`
2. Atualização do `main.md` (status, ativada, branch, título, **§Implementação reescrita pra 3 apps**)
3. Criação de `state.md` + `memory.md`
4. Criação de 4 stubs de feature em `docs/features/`
5. Stack confirmada: NestJS / Next App Router / Vite+React / pnpm workspaces
6. CLAUDE.md atualizado (placeholders de stack e comandos substituídos)

### Hipóteses em jogo

- ~~**`docs/specs/scp-spec.md` é a fonte autoritativa para parâmetros operacionais**~~ — **descartada 2026-05-08 15:13**: arquivo nunca existiu (pasta `docs/specs/` não existe). Parâmetros operacionais estão inline no `main.md`.

### Decisões recentes que importam pra continuar

- [2026-05-08 16:43] **Stack do backend revisada:** Express 4 + TypeORM 0.3 cru (não NestJS). Razão: alinhar com `wynk_ecommerce/backend/`. Dev confirmou apagar backend/ atual e recriar espelhando estrutura do wynk_ecommerce. Versões alinhadas com `wynk_ecommerce/backend/package.json`.
- [2026-05-08 16:43] **Naming Postgres:** tabelas `tb_<entity>`, colunas com prefixo `<entity>_<col>` snake_case, property TS camelCase via `name:` no decorator. Schema dedicado = `scp`. PK = uuid. Migrations SQL puro com schema dinâmico.
- [2026-05-08 16:43] **Divergência consciente:** wynk_ecommerce tem `tb_white_label_config` (Modelo B — DB). SCP usa Modelo A (flavor folder). Justificada por dev em 15:30.
- [2026-05-08 15:33] **White-label = Modelo A (build-time).** Branding em `portal/flavors/<slug>/{theme.json, logo.svg, favicon.ico}`. Tabela `tb_tenant` (renomeada de `tenants`) perde colunas de branding. Endpoint `/tenant/resolve`. Cache Redis em `tenant:resolve:{host}`. Fallback em `portal/flavors/_default/`. CI valida correspondência tabela ↔ pastas.
- [2026-05-08 15:33] **npm workspaces** (não pnpm).
- [2026-05-08 14:31] **Frontends:** Next.js App Router (portal — SSR pra SEO), Vite+React (backoffice — SPA logada). Sem Turborepo no início.
- [2026-05-08 14:31] **Resolução de tenant fica no backend**, não no Next. Portal SSR chama backend; backend cacheia em Redis.
- [2026-05-08 14:31] **Auth:** cookies HttpOnly + Secure + SameSite=Lax. Lib: `jsonwebtoken` (alinhado com wynk_ecommerce).
- [2026-05-08 14:22] Branch oficial: `feature/multitenant-platform`.

### Respostas-chave do usuário

- [2026-05-08 16:43] Usuário: "Podemos mudar para Express?" → após apresentação de trade-offs → "1 - sim / 2 - reescrever só o que for usar / 3 - ok"
  Contexto: após eu mapear que `wynk_ecommerce` usa Express+TypeORM cru em todos os 4 services backend, dev pediu pra alinhar a stack do SCP. Confirmou (1) manter estrutura inteira do wynk_ecommerce, (2) reescrever utilitários sob demanda, (3) apagar `backend/` atual e recomeçar.
- [2026-05-08 16:38] Usuário: "Olha qual utilizamos no wynk_ecommerce" + "Sim, a ideia é seguir esse padrão"
  Contexto: ao decidir ORM, pediu pra checar o padrão da casa. Confirmou TypeORM + naming verboso (`tb_<entity>`, colunas com prefixo).
- [2026-05-08 15:33] Usuário: "Isso, modelo A"
  Contexto: após 3 modelos de white-label (A build-time, B runtime/DB, C híbrido), escolheu A. Justificativa literal: "se deixamos tudo na base podemos altera em produção sem testar antes, então sendo em aquivos flavors/<slug>/theme.json a unica forma de alterar é publicando uma nova versão em TI e depois promove-la".
- [2026-05-08 15:30] Usuário: "Pode ser, outra coisa que precisamos definir é criar uma especie de white label..."
  Contexto: confirmou troca pnpm → npm workspaces.
- [2026-05-08 14:31] Usuário: "Ok, então sim, manda bala"
  Contexto: confirmou stack dos 3 apps (na época, com NestJS — depois revisada).
- [2026-05-08 14:22] Usuário: "Confirmo plano de ativação / Atualizar o main.md pra refletir feature/multitenant-platform"
  Contexto: optou por alinhar `main.md` à branch já existente.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda — sessão de ativação)_

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260503-1505-base-plataforma-multitenant/main.md` (atualizado)
- `docs/active/SPEC-20260503-1505-base-plataforma-multitenant/state.md` (criado)
- `docs/active/SPEC-20260503-1505-base-plataforma-multitenant/memory.md` (criado — este)
- `docs/features/infra-base.md` (criado — stub)
- `docs/features/tenant-resolution.md` (criado — stub)
- `docs/features/auth.md` (criado — stub)
- `docs/features/theme-system.md` (criado — stub)

### Onde parei exatamente

Fase 2 fechada e validada end-to-end. Próxima sessão começa fase 3:

**Fase 3 — Resolução de tenant por host:**

1. **`backend/src/services/tenant-resolver.service.ts`** — função `resolveByHost(host: string): Promise<TenantContext | null>`:
   - Tenta cache Redis: `tenant:resolve:{host}` (key)
   - Cache miss → query `SELECT tenant_id, tenant_slug, tenant_flavor_slug FROM scp.tb_tenant WHERE tenant_host = $1`
   - Se achou: serializa pra JSON, salva no Redis com TTL 600s (10 min), retorna
   - Se não achou: retorna null (caller decide se 404 ou fallback)

2. **`backend/src/middleware/resolve-tenant-by-host.ts`** — middleware Express:
   - Pega `host = req.hostname` (Express já normaliza)
   - Chama `tenantResolver.resolveByHost(host)`
   - Se achou: `(req as any).tenant = tenant` (pra que `tenantContextMiddleware` pegue)
   - Se não: `res.status(404).json({ error: 'tenant_not_found' })`
   - Pular esse middleware em rotas como `/health` (que devem responder mesmo sem tenant)

3. **`backend/src/controllers/tenant.controller.ts`** — handler de `GET /tenant/resolve`:
   - Pega `req.tenant` (já populado pelo middleware)
   - Retorna `{ id, slug, flavorSlug }` (camelCase explícito, não vaza created_at/updated_at)

4. **`backend/src/routes/tenant.routes.ts`** + registro em `app.ts`.

5. **Invalidação:**
   - Service `TenantService` com `update(id, patch)` que: faz update no DB → se mudou `host` ou `flavor_slug`, chama `redis.del('tenant:resolve:' + oldHost)` e novo host (se aplicável). MVP pode ter SQL direto + nota de invalidar.

6. **Testes:**
   - Unit do `tenant-resolver.service.ts` mockando Redis e DataSource.
   - E2E: subir backend + DB + redis, inserir tenant, hit `/tenant/resolve` com header `Host: shopping-x.local` → 200; hit segundo idêntico → ver no log que pegou do cache (Redis).

7. **Smoke test:** simular o fluxo do portal — request com host real, response com `flavorSlug`, comparar com pasta `portal/flavors/<slug>/` existindo.

**Conhecimento útil pra retomada:**
- Postgres em `localhost:5435`, Redis em `localhost:6382`. Backend em `localhost:3001`.
- `docker-compose up -d` sobe ambos. `db:setup -w backend` aplica migrations (já aplicadas no env atual).
- 1 tenant exemplo já inserido no DB local nesta sessão: slug=`shopping-x`, host=`shopping-x.local`, flavor_slug=`shopping-x`.
- `tb_tenant` (NÃO `tenants`) — convenção wynk_ecommerce.
- Helper `withTenant(qb)` lê do AsyncLocalStorage. Usar em queries de outras entities (não no Tenant em si).
- Subscriber `TenantSubscriber` está registrado via glob em `AppDataSource.subscribers`. Não precisa registrar em `app.ts`.
- `tenantContextMiddleware` deve vir DEPOIS do `resolveTenantByHost` no pipeline Express (este popula `req.tenant`, aquele propaga pro AsyncLocalStorage).
- ioredis com `lazyConnect: true` — primeira chamada conecta. Pra testes não-DB, mockar.
- `safer-buffer` na dep direta + `@types/express` 4.x via override (gotchas da fase 1.5 ainda relevantes).

Pendência externa pra dev decidir antes da fase 1 começar: mini-SPEC de limpeza pras referências fantasma em SPEC-1506/1507/1508/1509/1510, ou deixa pra ativação de cada uma.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-08 14:22 | em curso | ativação | Move future→active, atualiza main.md, cria state/memory + 4 stubs de feature |
