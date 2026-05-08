# State — SPEC-20260503-1505

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 15:13
**Onde tô:** SPEC ativada + stack decidida + referências à guia limpa. Fase 0 fechada. Pronto pra fase 1 (bootstrap dos 3 apps). Sessão fechando com commit da ativação.
**Próximo passo:** Iniciar fase 1: pnpm workspace na raiz + `backend/` (NestJS) + `portal/` (Next.js App Router) + `backoffice/` (Vite + React) + lint/format + CI mínimo. **Não há nada a ler em Nível 1+** (a "guia" `scp-spec.md` nunca existiu como arquivo).
**Última decisão:** Stack confirmada — NestJS / Next App Router / Vite+React / pnpm workspaces. Sem Turborepo no início.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** TL;DR + entradas `[ativação]` (14:22), `[MARCO] [decisão] Stack` (14:31) e `[descoberta] guia fantasma` (15:13).

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 0 | Quebra de fases + stack definidas com o dev | concluído | 2026-05-08 14:31 | — |
| 1 | Bootstrap monorepo pnpm: `backend/` (NestJS), `portal/` (Next.js App Router), `backoffice/` (Vite + React), lint/format, CI | pendente | 2026-05-08 14:31 | — |
| 2 | Schema multitenant + helper `db/withTenant` (proíbe queries sem `tenant_id`) | pendente | 2026-05-08 14:22 | — |
| 3 | Tabela `tenants` + resolução por `host` + cache Redis (`tenant:config:{host}`, TTL 10 min) | pendente | 2026-05-08 14:22 | — |
| 4 | `app/layout.tsx` aplica CSS vars do tenant resolvido | pendente | 2026-05-08 14:22 | — |
| 5 | Auth JWT (15 min) + refresh (7 dias) em cookies HttpOnly + Secure | pendente | 2026-05-08 14:22 | — |
| 6 | Seed de 1 tenant + validação E2E (todos os critérios de aceite) | pendente | 2026-05-08 14:22 | — |
| 7 | Atualização das 4 features tocadas (R.7) + arquivamento | pendente | 2026-05-08 14:22 | — |

### Próximos passos

- [x] Confirmar quebra de fases (acima) com o dev (2026-05-08 14:31)
- [x] Confirmar stack dos 3 apps com o dev (2026-05-08 14:31)
- [x] Limpar referências fantasma à guia `scp-spec.md` no `main.md` (2026-05-08 14:35)
- [ ] **(externo a esta SPEC)** Decidir com dev se referências fantasma nas outras 5 SPECs em `future/` (1506-1510) viram mini-SPEC de limpeza ou ficam pra ativação de cada uma
- [ ] Iniciar fase 1: pnpm workspace + `backend/` (NestJS) + `portal/` (Next.js App Router) + `backoffice/` (Vite+React) + lint/format + CI mínimo

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-08 14:22] SPEC ativada movendo `docs/future/SPEC-20260503-1505-.../` → `docs/active/SPEC-20260503-1505-.../`. Fonte: `git mv` executado nesta sessão.
- [2026-05-08 14:22] Branch oficial é `feature/multitenant-platform` (decisão do dev, sobrepõe contrato original `feature/base-plataforma-multitenant`). Fonte: usuário em 2026-05-08 14:22, `main.md:10`.
- [2026-05-08 14:22] Repositório está praticamente vazio em termos de código (sem `package.json`, `app/`, `lib/`, etc.). Fonte: estrutura do repo no momento da ativação — só `docs/` populado.
- [2026-05-08 14:22] As 4 features tocadas (`infra-base`, `tenant-resolution`, `auth`, `theme-system`) ainda **não existem** em `docs/features/` — serão criadas como stubs nesta sessão (R.4 + R.11). Fonte: `ls docs/features` retornou diretório inexistente.
- [2026-05-08 14:22] `docs/INDEX.md` ainda diz "nenhuma feature" — será regenerado pelo CI quando as features forem mergeadas em `main`. Fonte: `docs/INDEX.md:9-11`.

## Inferências prováveis

- ~~[2026-05-08 14:22] A "spec-mãe" em `docs/specs/scp-spec.md` (referenciada em §6.2/§8/§9/§10 dentro do `main.md`) tem detalhes operacionais que vão ancorar as decisões técnicas.~~ **Refutada 2026-05-08 15:13:** o arquivo nunca existiu fisicamente (`docs/specs/` não existe). Ver `[descoberta]` 15:13.
- [2026-05-08 14:22] Memória do projeto registra que SPEC-stores-public-api depende desta SPEC-1505 + SPEC-1506 — sugere que outras SPECs estão pausadas aguardando essa base. Validar com: olhar `docs/future/SPEC-20260503-1506-.../main.md` quando essa SPEC for ativada (não agora — fora de escopo).

## Dúvidas em aberto

- [2026-05-08 14:22] ~~CLAUDE.md menciona "Backend + Portal + Backoffice" como apps separados, mas `main.md` da SPEC-1505 fala em "Next.js App Router" único.~~ **Resolvida 2026-05-08 14:31:** monorepo de 3 apps separados (CLAUDE.md venceu). `main.md` §Implementação reescrita.
- [2026-05-08 14:22] ~~Stack final dos frontends ainda placeholder no CLAUDE.md.~~ **Resolvida 2026-05-08 14:31:** NestJS / Next.js App Router / Vite+React / pnpm workspaces.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-08 14:22 — [ativação]

SPEC movida de `docs/future/` → `docs/active/`. `main.md` atualizado:
- `Status: draft` → `active`
- `Ativada: —` → `2026-05-08 14:22`
- `Branch: feature/base-plataforma-multitenant (quando ativa)` → `feature/multitenant-platform`
- Título corrigido (placeholder " p" → "Base da plataforma multitenant", espelhando o slug)

Stubs de feature criados em `docs/features/`: `infra-base.md`, `tenant-resolution.md`, `auth.md`, `theme-system.md`. Cada um com linha em "Em execução" apontando para esta SPEC + branch (R.11).

Plano de fases inicial registrado na tabela acima (7 fases). A confirmar com o dev antes de iniciar fase 1.

Nada de código nesta sessão — só ativação documental.

Arquivos identificados como relevantes para próximas sessões (ainda não lidos — Nível 1 sob confirmação):
- `docs/specs/scp-spec.md` (spec-mãe — §6.2 host resolution, §8 theme, §9 cache, §10 auth)

Commit: — (a fazer no fim da sessão de ativação)

## 2026-05-08 15:13 — [descoberta] A "guia" `docs/specs/scp-spec.md` nunca existiu como arquivo

Ao tentar localizar a guia para confirmar remoção, descobri que **`docs/specs/` não existe no repo**. Comando: `ls /home/alatour/repositories/wynk_scp/docs/specs/` → "No such file or directory".

Logo, `scp-spec.md` é uma **referência conceitual fantasma** — provavelmente nasceu como guia mental durante o planejamento que gerou a leva de SPECs em `future/`, mas nunca foi materializada em arquivo. Não há nada a remover.

**Problema sistêmico (transparência R.8):** Um `grep` por "scp-spec" tocou de raspão a linha 12 das 5 SPECs em `future/` (1506-1510). Cada uma tem `**Origem:** sugerida em \`docs/specs/scp-spec.md\` §11 Fase X`. Foi uma "leitura" superficial não-confirmada (1 linha por arquivo, só pra mapear o problema). Reportado ao dev — ele decide se vira mini-SPEC de limpeza ou se cada SPEC corrige na ativação. **NÃO** editei nenhuma SPEC em `future/`.

Promoção de inferência → fato refutado: a hipótese de que `scp-spec.md` "tem detalhes operacionais que vão ancorar decisões" caiu. Os parâmetros operacionais estão **inline no `main.md`** (TTL 10 min, JWT 15 min, refresh 7 dias, etc.) e isso basta.

Implicação prática: **fase 1 pode começar sem leitura de Nível 1+**. Próxima sessão vai direto pro bootstrap.

## 2026-05-08 14:35 — [nota] Limpeza de referências à guia descartável

Dev confirmou que `docs/specs/scp-spec.md` foi criada apenas como guia inicial para gerar a leva de SPECs em `future/`, e **não é fonte da verdade durante execução**. As 4 âncoras `§6.2 / §8 / §9 / §10` no escopo do `main.md` apontavam pra essa guia — viraram órfãs.

Limpeza no `main.md`:
- Escopo: removidas as 4 âncoras `§X`. Conteúdo operacional (TTL 10 min, JWT 15 min, refresh 7 dias, cookies HttpOnly+Secure+SameSite=Lax) mantido inline.
- Origem: ajustada de "sugerida em `docs/specs/scp-spec.md` §11 Fase 1" para "derivada da guia inicial (descartável após gerar esta leva de SPECs)".

Implicação: **não preciso ler nada de Nível 1+ antes da fase 1**. Vou direto ao bootstrap.

Pendente: decidir se a guia `docs/specs/scp-spec.md` permanece no repo como histórico ou é removida.

## 2026-05-08 14:31 — [MARCO] [decisão] Stack dos 3 apps + tooling de monorepo

Decisão definitiva da arquitetura física da plataforma:

- **`backend/`** → **NestJS**. Alternativas consideradas: Fastify cru (mais simples, perf alta, mas precisa wirar DI/validação manualmente), Express (legado, descartado). Escolha por NestJS porque o fluxo "request → resolver tenant → injetar contexto via `AsyncLocalStorage` → validar JWT → query tenant-aware" mapeia diretamente nos primitivos do framework (interceptors / guards / DI). Trade-off: framework opinativo, curva ~1 dia, magic perceptível em debug.
- **`portal/`** → **Next.js (App Router)**. Necessário SSR pra SEO de site público de shopping. `headers()` server-side resolve host por request. Sem SSR perde SEO. Alternativa Vite descartada por isso.
- **`backoffice/`** → **Vite + React**. Área logada, SEO irrelevante, build mais rápido. SPA tradicional consumindo a API.
- **Tooling:** pnpm workspaces puro. Turborepo não antecipado — entra só se a CI doer.

Resposta literal do dev (14:31): "Ok, então sim, manda bala" — após explicação detalhada de NestJS vs Fastify e trade-offs.

Implicação imediata na seção `Implementação` do `main.md`: reescrita pra refletir os 3 apps. CLAUDE.md atualizado pra substituir os placeholders de stack e comandos.

Commit: — (a fazer no commit da ativação)
