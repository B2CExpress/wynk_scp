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

Monorepo gerenciado por **npm workspaces** (Node 22+).

- **Backend** (`backend/`): **Express 4 + TypeORM 0.3** + TypeScript — API multitenant. Stack alinhada com `wynk_ecommerce/backend/`. Resolve tenant por `host`, owns o schema com `tenant_id` e o helper `withTenant`. Tenant context via middleware Express + `AsyncLocalStorage`. Estrutura: `controllers/services/repositories/routes/entities/migrations/subscribers/middleware/dtos/config/utils/`.
- **Portal** (`portal/`): **Next.js (App Router)** + TypeScript — site público de cada shopping. SSR para SEO; `app/layout.tsx` lê `host` via `headers()` server-side, chama `GET /tenant/resolve` no backend, importa `portal/flavors/<slug>/theme.json` e aplica CSS variables.
- **Backoffice** (`backoffice/`): **Vite + React** + TypeScript — painel de gestão (Tenant Admin, Editor, Superadmin). SPA logada, sem SSR.
- **White-label:** **build-time** (Modelo A). Identidade visual de cada tenant em `portal/flavors/<slug>/{theme.json, logo.svg, favicon.ico}`, versionada em git. Edição só via PR + deploy. Branding **nunca** passa pelo banco.
- **Banco:** PostgreSQL (com `tenant_id` em todas as tabelas multitenant). Schema dedicado `scp`. Tabela `tb_tenant` guarda só identidade operacional (`tenant_id, tenant_slug, tenant_host, tenant_flavor_slug, ...`). Naming: `tb_<entity>` + colunas com prefixo `<entity>_<col>` (alinhado com wynk_ecommerce).
- **Cache:** Redis (mapeamento `tenant:resolve:{host}` → `{id, slug, flavor_slug}`, TTL 10 min). Cliente: `ioredis`.
- **Auth:** JWT (15 min, `jsonwebtoken`) + refresh token (7 dias) em cookies HttpOnly + Secure + SameSite=Lax

> Decisões registradas em SPEC-20260503-1505: stack inicial 2026-05-08 14:31 → revisão Express 16:43; white-label Modelo A 15:33; npm workspaces 15:33.

## Comandos

```bash
# Setup inicial (na raiz)
npm install

# Backend (Express + TypeORM)
npm run dev -w backend                  # ts-node-dev --respawn src/server.ts
npm run build -w backend
npm test -w backend
npm run lint -w backend
npm run typecheck -w backend
npm run migration:run -w backend        # aplicar migrations pendentes
npm run migration:revert -w backend     # desfazer última migration
npm run migration:create -w backend -- <NomePascalCase>   # criar migration vazia

# Portal (Next.js, site público)
npm run dev -w portal
npm run build -w portal
npm run lint -w portal
npm run typecheck -w portal

# Backoffice (Vite, painel de gestão)
npm run dev -w backoffice
npm run build -w backoffice
npm run lint -w backoffice
npm run typecheck -w backoffice

# Em todos os workspaces (na raiz)
npm run lint
npm run typecheck
npm test
npm run format        # prettier --write
npm run format:check  # CI
```

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
