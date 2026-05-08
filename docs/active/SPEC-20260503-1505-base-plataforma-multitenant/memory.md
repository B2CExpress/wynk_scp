# Memory — SPEC-20260503-1505

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 15:13 (sessão #1)
**Onde tô:** SPEC ativada + stack confirmada + referências limpas. Fase 0 fechada. Sessão fechando com commit.
**Próximo passo:** Iniciar fase 1: pnpm workspace + scaffolds de NestJS / Next App Router / Vite+React + lint/format + CI. **Sem leitura de Nível 1+ pendente** (a "guia" `scp-spec.md` nunca existiu como arquivo).
**Última decisão:** Stack = NestJS (backend) + Next.js App Router (portal) + Vite+React (backoffice) + pnpm workspaces. Sem Turborepo até dor real.
**Bloqueio atual:** nenhum. **Pendência externa:** dev decide se mini-SPEC de limpeza pra referências fantasma nas SPECs 1506-1510 ou deixa pra cada ativação.
**Se retomar, ler:** state.md TL;DR + entrada `[descoberta] guia fantasma` (15:13).

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

- [2026-05-08 14:31] **Stack:** NestJS (backend) + Next.js App Router (portal) + Vite+React (backoffice) + pnpm workspaces. Sem Turborepo no início. Decisão arquitetural ativa — vai pra `features/<X>.md` no arquivamento (R.7).
- [2026-05-08 14:31] **Resolução de tenant fica no backend**, não no Next. Portal SSR chama `GET /tenant/config` do backend; backend cacheia em Redis. (Mudança vs. esboço original do `main.md` que falava em `lib/tenant.ts` no Next.)
- [2026-05-08 14:31] **Auth:** cookies HttpOnly + Secure + SameSite=Lax. SameSite=Lax adicionado nesta sessão (não estava explícito no `main.md` original).
- [2026-05-08 14:22] Branch oficial: `feature/multitenant-platform`. `main.md` atualizado.
- [2026-05-08 14:22] Título do `main.md` corrigido (era " p", virou "Base da plataforma multitenant").

### Respostas-chave do usuário

- [2026-05-08 14:31] Usuário: "Ok, então sim, manda bala"
  Contexto: após explicação detalhada de NestJS vs Fastify cru e trade-offs do framework, confirmou stack dos 3 apps.
- [2026-05-08 14:22] Usuário: "Confirmo plano de ativação / Atualizar o main.md pra refletir feature/multitenant-platform"
  Contexto: ao escolher entre renomear branch local vs. atualizar contrato vs. manter divergência, dev optou por alinhar o `main.md` à branch já existente.

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

Sessão #1 fechando com commit da ativação. Próxima sessão (fase 1):
1. `pnpm init` na raiz + `pnpm-workspace.yaml`
2. Scaffold `backend/` com Nest CLI (`nest new backend --package-manager pnpm`)
3. Scaffold `portal/` com Next.js (`pnpm create next-app portal --typescript --app --no-tailwind`) — decidir Tailwind ou outro depois
4. Scaffold `backoffice/` com Vite (`pnpm create vite backoffice --template react-ts`)
5. Lint/format compartilhado (eslint + prettier na raiz, configs em cada app estendendo)
6. CI mínimo: lint + typecheck + test em todos os 3 apps em paralelo

Pendência externa pra dev decidir antes da fase 1 começar: mini-SPEC de limpeza pras referências fantasma em SPEC-1506/1507/1508/1509/1510, ou deixa pra ativação de cada uma.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-08 14:22 | em curso | ativação | Move future→active, atualiza main.md, cria state/memory + 4 stubs de feature |
