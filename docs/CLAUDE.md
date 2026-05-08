# CLAUDE.md — Shopping Centers Plataform

Plataforma multitenant para sites de shopping centers, permitindo que múltiplos shoppings compartilhem a mesma infraestrutura com identidade visual, conteúdo e configurações completamente independentes por tenant.

---

## AVISO IMPERATIVO PRA IA (LER PRIMEIRO)

Este é um projeto **SPEC-driven v2**. A documentação em `docs/` **não é para humanos** — é para VOCÊ (IA) ter contexto rico quando retomar, continuar ou mexer em qualquer parte do projeto.

**PROIBIDO** ler arquivos Nível 1+ (features, SPECs) sem **confirmação explícita do usuário**.
**OBRIGATÓRIO** seguir o protocolo de escalação do `docs/RULES.md` §4.

---

## Primeira ação obrigatória em QUALQUER sessão

Antes de qualquer código, qualquer resposta substantiva:

1. Ler este `CLAUDE.md`
2. Ler `docs/RULES.md` (processo completo — fonte da verdade)
3. Ler `docs/INDEX.md` (mapa de features do projeto)
4. Listar `docs/active/` (SPECs ativas na branch local — pode estar vazio em main)
5. Confirmar por texto que leu:
   > *"Li CLAUDE.md, docs/RULES.md v2, docs/INDEX.md (X features). Active local: [lista]. Como posso ajudar?"*
6. Aguardar o prompt do usuário e seguir o protocolo de escalação do RULES §4.

**Se houver SPEC ativa e o prompt conectar ao escopo dela:** pode ler `docs/active/SPEC-X/main.md` (contrato) após confirmar classificação. **NÃO** leia `state.md` ou `memory.md` da SPEC sem ANTES informar o usuário e pedir confirmação.

---

## Stack

Monorepo gerenciado por **pnpm workspaces**.

- **Backend** (`backend/`): **NestJS** + TypeScript — API multitenant. Resolve tenant por `host`, owns o schema com `tenant_id` e o helper `withTenant`. Tenant context via interceptor + `AsyncLocalStorage`.
- **Portal** (`portal/`): **Next.js (App Router)** + TypeScript — site público de cada shopping. SSR para SEO; `app/layout.tsx` lê `host` via `headers()` server-side, consome `GET /tenant/config` do backend e aplica CSS variables.
- **Backoffice** (`backoffice/`): **Vite + React** + TypeScript — painel de gestão (Tenant Admin, Editor, Superadmin). SPA logada, sem SSR.
- **Banco:** PostgreSQL (com `tenant_id` em todas as tabelas multitenant)
- **Cache:** Redis (config de tenant em `tenant:config:{host}`, TTL 10 min — TTLs em SPEC-1505 §9)
- **Auth:** JWT (15 min) + refresh token (7 dias) em cookies HttpOnly + Secure + SameSite=Lax
- **CDN:** assets versionados em `cdn.plataforma.com/{tenant-id}/...`

> Decisão de stack registrada em SPEC-20260503-1505 (2026-05-08 14:31). Turborepo não adotado — entra só se a CI doer.

## Comandos

```bash
# Setup inicial (na raiz)
pnpm install

# Backend
pnpm --filter backend dev          # dev server (NestJS)
pnpm --filter backend build
pnpm --filter backend test
pnpm --filter backend db:migrate

# Portal (Next.js, site público)
pnpm --filter portal dev
pnpm --filter portal build
pnpm --filter portal test

# Backoffice (Vite, painel de gestão)
pnpm --filter backoffice dev
pnpm --filter backoffice build
pnpm --filter backoffice test

# Tudo de uma vez
pnpm -r lint
pnpm -r typecheck
pnpm -r test
```

_(Os `package.json` de cada projeto serão criados na fase 1 da SPEC-20260503-1505. Os comandos acima refletem o contrato pretendido.)_

---

## Processo SPEC-driven v2 — resumo

Fonte da verdade: [docs/RULES.md](docs/RULES.md). Resumo operacional:

1. **Documentação é para a IA**, não para humanos. Única exceção: `main.md` de cada SPEC (contrato humano-validado).
2. **Estrutura:**
   - `docs/features/<area>.md` — estado VIVO de cada área do código
   - `docs/active/SPEC-<id>/` — 3 arquivos: main (contrato), state (log), memory (cérebro vivo)
   - `docs/future/`, `docs/archive/`, `docs/discard/` — ciclo de vida
   - `docs/INDEX.md` — mapa de features (gerado pelo CI)
3. **IDs de SPEC = timestamp** (`SPEC-YYYYMMDD-HHMM-slug`). Nunca sequencial. Nunca reutilizar.
4. **Invariante:** `docs/active/` em `main` é sempre VAZIO. SPECs ativas vivem APENAS em branches.
5. **Toda SPEC se vincula a 1+ feature.** Feature nova nasce com a SPEC que a introduz.
6. **Timestamps obrigatórios em TUDO:** checkbox, célula de status, decisão, atualização. Commit hash quando houver código.
7. **Ao concluir SPEC**, todas as features tocadas DEVEM ser atualizadas no mesmo PR (R.7). `audit-docs.sh` bloqueia PR sem isso.
8. **Classificação obrigatória de prompt:** continuidade / nova SPEC / livre. Em ambiguidade, PERGUNTAR — nunca assumir.
9. **Protocolo de escalação de leitura:**
   - Nível 0 (CLAUDE + RULES + INDEX): sempre, automático
   - Nível 1 (features + main da SPEC): sob CONFIRMAÇÃO do dev
   - Nível 2 (state + memory da SPEC): sob PERGUNTA EXPLÍCITA
   - Nível 3 (archive de outras SPECs): só se raciocínio histórico for necessário
10. **Append-only no `state.md`**; sobrescrever no `memory.md`; atualizar `features/<X>.md` ao arquivar SPEC.

---

## Convenções de código

_(adicionar convenções específicas do projeto aqui conforme forem sendo estabelecidas: tamanho máximo de arquivo, estilo, imports, nomenclatura, comentários, testes, etc.)_

---

## Arquitetura

_(resumo rápido da arquitetura. Se crescer, mover para `docs/features/` quebrado por área.)_

---

## Visão de produto

_(resumo da visão. Se crescer, mover para arquivo dedicado.)_
