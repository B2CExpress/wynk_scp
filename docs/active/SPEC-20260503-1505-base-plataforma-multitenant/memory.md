# Memory — SPEC-20260503-1505

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 15:53 (sessão #1)
**Onde tô:** Fase 1 fechada. Monorepo bootstrapped, 909 pacotes instalados, lint/typecheck/test/format passam nos 3 apps. CI workflow no lugar.
**Próximo passo:** Fase 2 — schema Postgres (tabela `tenants` enxuta) + helper `db/withTenant` no backend. **Decisão pendente:** ORM (TypeORM, Drizzle, ou Prisma).
**Última decisão:** Aplicada em fase 1: ESLint+Prettier configurados, `.prettierignore` exclui `docs/` (SPEC-driven tem convenção própria). `portal/CLAUDE.md` deletado (conflitava com `docs/CLAUDE.md`); `portal/AGENTS.md` mantido (aviso útil sobre Next 15+).
**Bloqueio atual:** nenhum. **Pendência externa:** dev decide depois se mini-SPEC de limpeza pra referências fantasma nas SPECs 1506-1510 ou deixa pra cada ativação.
**Se retomar, ler:** state.md TL;DR + entrada `[conclusão] Fase 1` (15:53).

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

- [2026-05-08 15:33] **White-label = Modelo A (build-time).** Branding em `portal/flavors/<slug>/{theme.json, logo.svg, favicon.ico}`. Tabela `tenants` perde colunas de branding (fica só `id, slug, host, flavor_slug, name, timestamps`). Endpoint backend renomeado de `/tenant/config` → `/tenant/resolve`. Cache Redis em `tenant:resolve:{host}`. Fallback em `portal/flavors/_default/`. CI valida correspondência tabela ↔ pastas.
- [2026-05-08 15:33] **npm workspaces** (não pnpm). pnpm precisaria sudo/PATH pra instalar — dev preferiu aproveitar Node já instalado. Trade-off aceito: sem strict peer deps. Migração trivial pra pnpm depois se necessário.
- [2026-05-08 14:31] **Stack:** NestJS (backend) + Next.js App Router (portal) + Vite+React (backoffice). Sem Turborepo no início. Decisão arquitetural ativa — vai pra `features/<X>.md` no arquivamento (R.7).
- [2026-05-08 14:31] **Resolução de tenant fica no backend**, não no Next. Portal SSR chama backend; backend cacheia em Redis.
- [2026-05-08 14:31] **Auth:** cookies HttpOnly + Secure + SameSite=Lax.
- [2026-05-08 14:22] Branch oficial: `feature/multitenant-platform`.

### Respostas-chave do usuário

- [2026-05-08 15:33] Usuário: "Isso, modelo A"
  Contexto: após apresentar 3 modelos de white-label (A build-time, B runtime/DB, C híbrido) com trade-offs, dev escolheu A. Justificativa dele (citação literal): "se deixamos tudo na base podemos altera em produção sem testar antes, então sendo em aquivos flavors/<slug>/theme.json a unica forma de alterar é publicando uma nova versão em TI e depois promove-la". (Errou letra — disse "b" mas a justificativa descrevia A; confirmou.)
- [2026-05-08 15:30] Usuário: "Pode ser, outra coisa que precisamos definir é criar uma especie de white label..."
  Contexto: confirmou troca de pnpm → npm workspaces e abriu a discussão de white-label que levou ao Modelo A.
- [2026-05-08 14:31] Usuário: "Ok, então sim, manda bala"
  Contexto: confirmou stack dos 3 apps após explicação NestJS vs Fastify.
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

Fase 1 fechada. Monorepo funcional. Próxima sessão começa fase 2:

1. **Decisão pendente — ORM:** TypeORM (oficial do Nest, batteries-included), **Drizzle** (TypeScript-first, sem SQL gerado por classes, mais leve), ou **Prisma** (gera client, ergonomia top, mas é mais "framework"). Apresentar trade-offs ao dev e bater martelo antes de codar.
2. Setup de Postgres + Redis local (docker-compose? script?).
3. Schema inicial: tabela `tenants(id uuid pk, slug text unique, host text unique, flavor_slug text not null, name text, created_at timestamptz, updated_at timestamptz)`. Constraint: `flavor_slug` precisa bater com pasta em `portal/flavors/<slug>/`.
4. Helper `db/withTenant` no backend — DI de repositório tenant-aware via `AsyncLocalStorage`. Queries cruas sem `tenant_id` lançam exceção (assert em dev, erro em prod).
5. Validação CI da correspondência tabela ↔ flavor folder — script ou job no workflow.
6. Migração inicial e seed de 1 tenant exemplo (com `flavor_slug: "_default"` ou criar `flavors/exemplo/`).

**Conhecimento útil pra retomada:**
- Versões instaladas: Nest 11, Next 16.2.6, Vite 8, React 19.2, TS 5.7 (backend) / 6 (backoffice).
- `npm install` na raiz consolida tudo no `node_modules` topo (workspaces).
- `npm run X -w app` roda script em workspace específico; `npm run X` na raiz roda em todos com `--workspaces --if-present`.
- Backend usa Jest 30 + ts-jest. Portal e backoffice ainda sem test runner — Vitest seria a escolha natural pra ambos.
- ESLint 9 flat config (`eslint.config.mjs` / `.js`) em todos os 3.

Pendência externa pra dev decidir antes da fase 1 começar: mini-SPEC de limpeza pras referências fantasma em SPEC-1506/1507/1508/1509/1510, ou deixa pra ativação de cada uma.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-08 14:22 | em curso | ativação | Move future→active, atualiza main.md, cria state/memory + 4 stubs de feature |
