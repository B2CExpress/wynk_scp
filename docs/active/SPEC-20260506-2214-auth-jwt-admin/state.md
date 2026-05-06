# State — SPEC-20260506-2214

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-06 22:14

---

## TL;DR (sobrescrever ao fim de cada sessao)

**Ultima atualizacao:** 2026-05-06 22:14
**Onde to:** SPEC recem-ativada na branch `feature/SQU-37-autenticacao-jwt`. Contrato escrito a partir do ticket SQU-37. Nenhum codigo escrito ainda — `backend/`, `portal/`, `backoffice/` estao vazios.
**Proximo passo:** Confirmar com dev a stack do `backend/` (Next.js App Router?) e a disponibilidade de Redis. Depois iniciar Fase 1 (schema + migration).
**Ultima decisao:** Login global (busca por email sem escopo de tenant) + cross-tenant prevenido via header `x-tenant-id` + isolamento por `domain: undefined` no cookie. Trade-off: mensagem generica em 401 vs UX pior, vence seguranca (anti-enumeracao).
**Bloqueio atual:** nenhum, mas aguardando confirmacao de stack para nao escrever codigo em framework errado.
**Se retomar, ler:** entradas de 2026-05-06 22:14 em diante (so existe a [ativacao] por enquanto).

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descricao | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Schema `admin_users` + migration | pendente | 2026-05-06 22:14 | — |
| 2 | Instalar deps (`jose`, `bcrypt`, `@types/bcrypt`) | pendente | 2026-05-06 22:14 | — |
| 3 | `lib/auth/password.ts` (bcrypt cost 10) | pendente | 2026-05-06 22:14 | — |
| 4 | `lib/auth/jwt.ts` (sign/verify access + refresh) | pendente | 2026-05-06 22:14 | — |
| 5 | Configurar `JWT_SECRET` em `.env`/`.env.example` | pendente | 2026-05-06 22:14 | — |
| 6 | `lib/auth/session.ts:getServerSession()` | pendente | 2026-05-06 22:14 | — |
| 7 | Endpoint POST `/api/auth/login` | pendente | 2026-05-06 22:14 | — |
| 8 | Endpoint POST `/api/auth/refresh` | pendente | 2026-05-06 22:14 | — |
| 9 | Endpoint POST `/api/auth/logout` | pendente | 2026-05-06 22:14 | — |
| 10 | Endpoint GET `/api/auth/me` | pendente | 2026-05-06 22:14 | — |
| 11 | Rate limit Redis no `/login` (token bucket, 5/min/IP) | pendente | 2026-05-06 22:14 | — |
| 12 | Seed: 1 admin por tenant + 1 superadmin | pendente | 2026-05-06 22:14 | — |
| 13 | Testes manuais (5 curls do ticket) | pendente | 2026-05-06 22:14 | — |
| 14 | Atualizar features (auth, admin-users) com decisoes finais | pendente | 2026-05-06 22:14 | — |

Status permitidos: `pendente` | `em progresso` | `concluido` | `bloqueado` | `descartado`.

### Proximos passos

- [ ] Confirmar stack do `backend/` com dev antes de qualquer install
- [ ] Confirmar disponibilidade de Redis (vem de SPEC-1505 ou subir local pra esta SPEC)
- [ ] Inicializar `backend/package.json` se ainda nao houver
- [ ] Implementar Fase 1 (schema + migration)

### Bloqueios ativos

_nenhum_

---

## Fatos confirmados

- [2026-05-06 22:14] Branch `feature/SQU-37-autenticacao-jwt` ja existe e esta em uso. Fonte: `git branch --show-current`.
- [2026-05-06 22:14] `backend/`, `portal/`, `backoffice/` estao vazios. Fonte: `ls`.
- [2026-05-06 22:14] `docs/features/` esta vazio — feature `auth` e `admin-users` serao criadas junto com esta SPEC (R.4). Fonte: `ls docs/features/`.
- [2026-05-06 22:14] `docs/active/` estava vazio antes da ativacao desta SPEC. Fonte: `ls docs/active/`.
- [2026-05-06 22:14] SPEC-20260503-1505 (em `future/`) cobre auth no §10 do escopo mas nao foi ativada. Fonte: `docs/future/SPEC-20260503-1505-base-plataforma-multitenant/main.md:28`.

## Inferencias provaveis

- [2026-05-06 22:14] Stack do `backend/` sera Next.js App Router + TypeScript + Drizzle. Validar com: pergunta direta ao dev OU `cat backend/package.json` quando existir.
- [2026-05-06 22:14] Redis sera provisionado pela SPEC-1505 antes desta concluir. Validar com: confirmacao do dev sobre ordem de execucao.
- [2026-05-06 22:14] Header `x-tenant-id` sera setado pelo middleware de tenant resolution da SPEC-1505. Validar com: cat do middleware quando existir, ou confirmar que esta SPEC mocka o header em testes.

## Duvidas em aberto

- [2026-05-06 22:14] Stack confirmada do `backend/`? Proxima acao: perguntar ao dev na proxima resposta dele.
- [2026-05-06 22:14] Redis ja disponivel ou subir junto? Proxima acao: perguntar ao dev; em DEV pode ter fallback in-memory ate Redis chegar.
- [2026-05-06 22:14] O ticket cita `app/api/auth/...` — confirmar se isso vive em `backend/` (Next.js como BFF) ou se o `backend/` e API pura (Express/Fastify) e os routes sao no `backoffice/`. Proxima acao: perguntar.
- [2026-05-06 22:14] Header `x-tenant-id` no login: vem do middleware de resolucao de tenant ja existente, ou esta SPEC precisa parsear `host` direto? Proxima acao: depende da ordem com SPEC-1505.

---

## Log cronologico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-06 22:14 — [MARCO] [ativacao]

SPEC criada e ativada para entregar SQU-37 (auth admin JWT) na branch `feature/SQU-37-autenticacao-jwt`.

**Plano inicial** (14 fases — ver tabela acima). Os passos 1-12 mapeiam 1:1 aos "Passos" do ticket; 13 e 14 sao R.7 do RULES (testes manuais + atualizacao de features).

**Arquivos identificados como relevantes** (a criar):
- `backend/lib/db/schema.ts`
- `backend/lib/auth/{password,jwt,session,rate-limit}.ts`
- `backend/app/api/auth/{login,logout,refresh,me}/route.ts`
- `backend/scripts/seed-tenants.ts`
- `backend/.env`, `backend/.env.example`

**Decisao chave registrada no contrato:** login global por email + cross-tenant em 2 camadas (header `x-tenant-id` + cookie `domain: undefined`). Mensagem generica em 401 (anti-enumeracao). `is_active=false` distingue como 403.

**Pendente antes de codar:** confirmar stack e disponibilidade de Redis com o dev.

Commit: — (nao houve mudanca de codigo nesta entrada, so docs)
