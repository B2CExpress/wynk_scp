# Memory — SPEC-20260503-1505

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-11 (sessão #3 — fase 6 concluída)
**Onde tô:** **Fase 6 fechada.** 8/8 critérios técnicos do `main.md` checados. Falta APENAS fase 7: atualizar `docs/features/{infra-base,tenant-resolution,auth,theme-system}.md` (R.7) + arquivar SPEC + entrada `[arquivamento]` no state.md.
**Próximo passo:** Fase 7 — atualizar 4 stubs de feature em `docs/features/` com timestamp + ref a esta SPEC, mover SPEC pra `docs/archive/SPEC-20260503-1505-...`, atualizar TL;DR final do memory.md, criar entrada `[arquivamento]` no state.md, commit + abrir PR.
**Última decisão:** Seed via `npm run seed -w backend` lê `seeds/tenants.json` (fonte canônica que também alimenta `validate-flavors`) + cria admin `admin@<host>` com senha do env `SEED_ADMIN_PASSWORD` (fallback `admin123` em dev). Idempotente. Cross-tenant isolation provado por 13 testes unitários do subscriber + withTenant (sem precisar DB).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** state.md TL;DR + entrada `[conclusão] Fase 6` (2026-05-11). Pra fase 7 ler RULES.md §R.7 (atualização de features na conclusão de SPEC).

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

Fase 3 fechada e validada E2E. Próxima sessão começa fase 4:

**Fase 4 — Portal Next.js consumindo `/tenant/resolve` + aplicando flavor:**

1. **`portal/src/lib/theme/types.ts`** — schema TypeScript de `theme.json`:
   ```ts
   export interface Theme {
     name: string;
     colors: { primary: string; secondary: string; text: string; background: string };
     fonts: { primary: string };
     meta: { title: string; description: string; ogImage: string };
     social: { instagram: string|null; facebook: string|null; youtube: string|null; tiktok: string|null };
     contact: { phone: string|null; email: string|null; address: string|null };
   }
   ```

2. **`portal/src/lib/tenant.ts`** — server-only helper:
   - `getTenantFromHost(host: string): Promise<TenantContext>` — chama `${BACKEND_URL}/tenant/resolve` com `Host` header. Cacheia com `unstable_cache` ou Next 16 cache API (mesma TTL).
   - `loadTheme(flavorSlug: string): Promise<Theme>` — `await import('@/flavors/' + flavorSlug + '/theme.json')` ou via fs read. Validar schema (zod ou manual TS).

3. **`portal/src/app/layout.tsx`** — substituir o scaffold:
   ```tsx
   const host = (await headers()).get('host')!;
   const tenant = await getTenantFromHost(host);
   const theme = await loadTheme(tenant.flavorSlug);
   const cssVars = { '--color-primary': theme.colors.primary, ... };
   return <html lang="pt-BR" style={cssVars}>
     <head>
       <title>{theme.meta.title}</title>
       <meta name="description" content={theme.meta.description} />
       <link rel="icon" href={`/flavors/${tenant.flavorSlug}/favicon.ico`} />
       <link href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fonts.primary)}&display=swap`} rel="stylesheet" />
     </head>
     <body>{children}</body>
   </html>
   ```

4. **Servir assets de flavors** — Next App Router serve `public/` automaticamente. Mas `portal/flavors/<slug>/` está fora de `public/`. Opções:
   - (a) Mover `flavors/` pra `public/flavors/` (mais simples — assets servidos direto).
   - (b) Criar API route que faz `res.sendFile(...)` (mais controle, mais complexidade).
   - **Recomendo (a).** Decidir e implementar.

5. **Validação CI** — script Node que:
   - Conecta no DB (ou lê migration/seed)
   - Pra cada `tenant_flavor_slug` em `tb_tenant`, verifica que existe `portal/public/flavors/<slug>/theme.json`, `logo.svg`, `favicon.ico`.
   - Falha o CI se algum estiver faltando.
   - Adicionar como step no `.github/workflows/ci.yml`.

6. **Smoke E2E** — adicionar entrada no `/etc/hosts` (`127.0.0.1 shopping-x.local`), abrir `http://shopping-x.local:3000` e verificar:
   - Cores corretas
   - Fonte carregada
   - Favicon e title corretos

**Conhecimento útil pra retomada:**
- Tenant exemplo já no DB local: `slug=shopping-x, host=shopping-x.local, flavor_slug=shopping-x`. Pasta `portal/flavors/shopping-x/` AINDA NÃO EXISTE — só `_default/`. Vou precisar criar pra smoke test funcionar.
- Backend em `localhost:3001`, portal em `localhost:3000` (Next default).
- Próximo step "trivial" antes de codar fase 4: criar `portal/flavors/shopping-x/{theme.json, logo.svg, favicon.ico}` copiando de `_default/` e ajustando cores pra ver visual diferente.
- Nesta sessão a SPEC fala em `portal/flavors/<slug>/` (não `portal/public/flavors/<slug>/`). Precisa decidir na fase 4 onde fica fisicamente — afeta como Next serve.
- BACKEND_URL pra portal chamar: `http://localhost:3001` em dev. Variável `NEXT_PUBLIC_BACKEND_URL` ou similar.
- Cache Redis funciona: `tenant:resolve:shopping-x.local` populado no Redis local após smoke test. Pra ver: `docker exec scp_redis redis-cli get tenant:resolve:shopping-x.local`.
- 13/13 testes passam: 4 suites (health, tenant-context, tenant-resolver, tenant-resolve-e2e).

Pendência externa pra dev decidir antes da fase 1 começar: mini-SPEC de limpeza pras referências fantasma em SPEC-1506/1507/1508/1509/1510, ou deixa pra ativação de cada uma.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-08 14:22 | ~8h | ativação + fases 1, 1.5, 2, 3, 4 (parcial) | Bootstrap monorepo + revisão de stack pra Express + schema multitenant + endpoint resolve + portal SSR (sem smoke) |
