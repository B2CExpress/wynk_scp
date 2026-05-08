# State — SPEC-20260503-1505

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 15:33
**Onde tô:** SPEC ativada + stack decidida + white-label decidido (Modelo A — flavor folder). `main.md` reescrito (Resumo, Escopo, Implementação, Critério de aceite). Pronto pra fase 1.
**Próximo passo:** Iniciar fase 1: **npm workspaces** na raiz (Node nativo, sem instalar pnpm) + `backend/` (NestJS) + `portal/` (Next.js App Router) + `backoffice/` (Vite + React) + lint/format + CI mínimo + estrutura inicial de `portal/flavors/_default/`.
**Última decisão:** White-label = Modelo A (build-time). Identidade visual em `portal/flavors/<slug>/{theme.json, logo.svg, favicon.ico}`, versionada em git. Tabela `tenants` perde colunas de branding e fica só com identidade operacional (`id, slug, host, flavor_slug`). Edição de branding só via PR + deploy.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** TL;DR + entradas `[MARCO] [decisão] Stack` (14:31), `[descoberta] guia fantasma` (15:13), `[MARCO] [decisão] White-label Modelo A` (15:33).

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 0 | Quebra de fases + stack definidas com o dev | concluído | 2026-05-08 14:31 | — |
| 1 | Bootstrap monorepo **npm workspaces**: `backend/` (NestJS), `portal/` (Next.js App Router), `backoffice/` (Vite + React), lint/format, CI, estrutura inicial `portal/flavors/_default/` | pendente | 2026-05-08 15:33 | — |
| 2 | Schema multitenant + helper `db/withTenant` (proíbe queries sem `tenant_id`); tabela `tenants(id, slug, host, flavor_slug, ...)` | pendente | 2026-05-08 15:33 | — |
| 3 | Endpoint `GET /tenant/resolve` (host → tenant) + cache Redis (`tenant:resolve:{host}`, TTL 10 min) | pendente | 2026-05-08 15:33 | — |
| 4 | `app/layout.tsx` lê `theme.json` do flavor + aplica CSS vars + injeta `<link rel="icon">`/meta. Schema TS de `theme.json` + validação CI da correspondência `tenants.flavor_slug` ↔ `portal/flavors/<slug>/` | pendente | 2026-05-08 15:33 | — |
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

## 2026-05-08 15:33 — [MARCO] [decisão] White-label = Modelo A (build-time / flavor folder) + monorepo via npm workspaces

Duas decisões arquiteturais grandes nesta entrada:

### 1. White-label: build-time, NÃO runtime

**Decisão:** identidade visual de cada tenant vive em `portal/flavors/<slug>/`, versionada em git. Edição só via PR + deploy.

Estrutura:
```
portal/flavors/
  _default/                    # fallback de assets ausentes
    theme.json
    logo.svg
    favicon.ico
  shopping-x/
    theme.json                 # cores, fontes, meta, social, contato
    logo.svg                   # obrigatório
    favicon.ico                # obrigatório
    og-image.jpg               # opcional
```

`theme.json` carrega: cores (primary/secondary/text/background), `font_primary` (Google Font), meta (title/description/og), social (instagram/facebook/...), contact (phone/email/address).

**Implicação no schema:** tabela `tenants` perde TODAS as colunas de branding. Fica só `id, slug, host, flavor_slug, name, created_at, updated_at` — identidade operacional. Branding nunca passa pelo banco.

**Endpoint backend:** `GET /tenant/config` → renomeado pra `GET /tenant/resolve`. Retorna `{ id, slug, flavorSlug }`. Cache Redis `tenant:resolve:{host}` (TTL 10 min, invalidado em alteração de host/flavor_slug — operação rara, não rotineira).

**Validação CI:** pra cada `flavor_slug` na tabela `tenants`, deve existir pasta `portal/flavors/<slug>/` com `theme.json` (válido contra schema TS), `logo.svg` e `favicon.ico`. Pasta `_default/` também é checada.

**Alternativas consideradas:**
- **Modelo B (runtime/DB)** — proposta original da SPEC. Permite editar branding em produção sem deploy. **Rejeitada** pelo dev: "se deixamos tudo na base podemos alterar em produção sem testar antes; em arquivos a única forma é publicando uma nova versão e promovendo".
- **Modelo C (híbrido)** — assets em flavor folder, dados estruturados (cores, meta) no DB. **Rejeitada** pelo mesmo motivo: cores no DB violariam a regra "branding só via deploy".

**Trade-off aceito:**
- (+) Branding 100% rastreável, revisável, com rollback trivial via git. Sem painel de branding.
- (+) Sem dependência de S3/CDN no MVP — assets estáticos servidos pelo Next.
- (+) Tipagem forte de `theme.json` em build (TS schema), CI valida correspondência.
- (−) Trocar logo/cor de um tenant = PR + deploy (esperado e desejado pelo dev).
- (−) Onboarding de novo tenant = SQL insert (operacional) + PR criando `portal/flavors/<slug>/` (visual). Não dá pra subir tenant 100% via DB.

Resposta literal do dev (15:30): "Eu prefiro o b pois se deixamos tudo na base podemos altera em produção sem testar antes, então sendo em aquivos flavors/<slug>/theme.json a unica forma de alterar é publicando uma nova versão em TI e depois promove-la". (Errou letra — quis dizer A; confirmou em seguida com "Isso, modelo A".)

### 2. npm workspaces (não pnpm)

**Decisão:** monorepo via `workspaces` no `package.json` raiz, com Node nativo. Não instalar pnpm.

**Motivação:** pnpm não está instalado no PC do dev e instalá-lo via corepack falhou por permissão (`/usr/bin` não-writable; precisaria `sudo` ou `~/.local/bin` + PATH). Em vez de tomar ação intrusiva no sistema, dev sugeriu aproveitar o Node já presente. npm workspaces (npm 7+, sólido desde 2020) cobre o caso de uso pra 3 apps.

**Trade-off aceito:**
- (+) Zero instalação extra, sem mexer em PATH/sudo.
- (+) Comando familiar (`npm run X -w app`).
- (−) Sem strict peer deps (phantom dependencies possíveis em runtime). Mitigação: TS estrito + lint pegam a maioria.
- (−) `node_modules` duplicado entre apps (sem cache global content-addressable). Custo de disco aceitável pra 3 apps.

Migração futura pra pnpm (se CI ficar lenta com mais apps) é trivial (~1 dia).

### Implicação no plano

`main.md` reescrito: §Resumo, §Escopo (DENTRO + FORA), §Implementação, §Critério de aceite. Tabela de fases atualizada (fase 1 mudou pra "npm workspaces" + criar `portal/flavors/_default/`; fase 3 agora é endpoint `/tenant/resolve` em vez de `/tenant/config`).

Commit: — (a fazer ao consolidar com início da fase 1)

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
