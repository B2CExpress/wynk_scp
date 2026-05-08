# State — SPEC-20260503-1505

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 17:04
**Onde tô:** Fase 1.5 (revisão de stack do backend) **concluída**. Backend Express+TypeORM rodando: typecheck, lint, test e format passam. Estrutura espelha `wynk_ecommerce/backend/`. Pronto pra fase 2.
**Próximo passo:** Fase 2 — `docker-compose.yml` (Postgres 16 + Redis 7); entity `Tenant` em `backend/src/entities/Tenant.ts`; migration inicial `<ts>-CreateTenantTable.ts`; `UuidHelper` em `backend/src/utils/uuid-helper.ts`; middleware `tenant-context.ts` com AsyncLocalStorage; helper `withTenant` em `backend/src/utils/with-tenant.ts`; subscriber TypeORM injetando `tenant_id`.
**Última decisão:** Fase 1.5 fechada. Express 4.22 + TypeORM 0.3.27 + jsonwebtoken 9 + ioredis 5 instalados. `@types/express` forçado pra 4.x via `overrides` na raiz (transitive 5.x do `@types/cookie-parser` invadia). `safer-buffer` adicionado como dep direta do backend (workaround pra hoisting npm workspaces — Jest não subia árvore pra resolver dep transitive de `iconv-lite`). `tsconfig` com `module: NodeNext`, `strictPropertyInitialization: false` (TypeORM), `isolatedModules: true` (ts-jest).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** TL;DR + entradas `[conclusão] Fase 1.5` (17:04), `[MARCO] [refactor] Revisão de stack: Express` (16:43), `[MARCO] [decisão] White-label Modelo A` (15:33).

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 0 | Quebra de fases + stack definidas com o dev | concluído | 2026-05-08 14:31 | — |
| 1 | Bootstrap monorepo **npm workspaces**: `backend/` (NestJS — **a ser refeito em Express, ver fase 1.5**), `portal/` (Next.js App Router), `backoffice/` (Vite + React), lint/format, CI, estrutura inicial `portal/flavors/_default/` | concluído (com revisão pendente) | 2026-05-08 16:43 | — |
| 1.5 | **Revisão de stack do backend:** apagar scaffold NestJS, recriar `backend/` em Express 4 + TypeORM 0.3 espelhando estrutura do `wynk_ecommerce/backend/src/`. Manter versões alinhadas (express ^4.18.2, typeorm ^0.3.17, jsonwebtoken ^9.0.2, ioredis ^5.8.2, etc.) | concluído | 2026-05-08 17:04 | — |
| 2 | Docker compose (Postgres 16 + Redis 7); schema `scp`; entity `Tenant` (`tb_tenant`); migration inicial; helper `withTenant` + middleware de tenant context com `AsyncLocalStorage`; subscriber TypeORM injetando `tenant_id` | pendente | 2026-05-08 16:43 | — |
| 3 | Endpoint `GET /tenant/resolve` (host → tenant) + cache Redis (`tenant:resolve:{host}`, TTL 10 min) | pendente | 2026-05-08 16:43 | — |
| 4 | `app/layout.tsx` lê `theme.json` do flavor + aplica CSS vars + injeta `<link rel="icon">`/meta. Schema TS de `theme.json` + validação CI da correspondência `tb_tenant.tenant_flavor_slug` ↔ `portal/flavors/<slug>/` | pendente | 2026-05-08 16:43 | — |
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

## 2026-05-08 17:04 — [conclusão] Fase 1.5 — Bootstrap do backend Express + TypeORM

Backend reescrito do zero em Express 4 + TypeORM 0.3, espelhando `wynk_ecommerce/backend/src/`. `npm run typecheck/lint/test/format:check` passam em todos os 3 apps.

**Apagado:** `backend/` Nest inteiro (`rm -rf`).

**Estrutura criada (espelha wynk_ecommerce):**
```
backend/
├── package.json                 # express ^4.22, typeorm ^0.3.27, jsonwebtoken ^9, ioredis ^5, etc.
├── tsconfig.json                # NodeNext + strictPropertyInitialization:false + isolatedModules:true
├── jest.config.js               # ts-jest + moduleDirectories pra workspaces hoisting
├── eslint.config.js             # flat config + typescript-eslint + prettier
├── typeorm.config.ts            # wrapper standalone pra CLI (re-exporta AppDataSource)
├── .env.example                 # vars: DB_*, REDIS_*, JWT_*, PORT, NODE_ENV
├── __tests__/
│   └── health.test.ts           # supertest no GET /health
└── src/
    ├── server.ts                # entry: conecta DB, sobe Express
    ├── app.ts                   # createApp() — helmet, cors, json, cookie-parser, morgan, /health, 404, error handler
    ├── config/
    │   ├── index.ts             # config tipada (env vars com required/optional/int)
    │   ├── database.ts          # AppDataSource (DataSource TypeORM)
    │   └── redis.ts             # ioredis com lazyConnect
    ├── utils/
    │   └── logger.ts            # JSON logger mínimo
    ├── controllers/.gitkeep
    ├── services/.gitkeep
    ├── repositories/.gitkeep
    ├── routes/.gitkeep
    ├── entities/.gitkeep
    ├── migrations/.gitkeep
    ├── subscribers/.gitkeep
    ├── middleware/.gitkeep
    └── dtos/.gitkeep
```

**Gotchas resolvidos durante o bootstrap:**

1. **`@types/express 5.x` invadindo via transitive de `@types/cookie-parser`** — `npm ls @types/express` mostrou que `@types/cookie-parser@1.4.10` exigia `@types/express@5.0.6`, sobrescrevendo nossa 4.x. **Fix:** `overrides` no `package.json` raiz forçando `@types/express ^4.17.21` e `@types/express-serve-static-core ^4.19.0`. Apagar `node_modules` + `package-lock.json` foi necessário pro override pegar.

2. **`safer-buffer` ausente da árvore após overrides** — após reinstalar com overrides, `npm install` deduplicou agressivamente e tirou `safer-buffer` (transitive de `iconv-lite` ← `body-parser` ← `express`). Jest não subia árvore pra encontrar (não existia em parent). **Fix:** adicionar `safer-buffer ^2.1.2` como dep direta do backend. Não-elegante mas pragmático.

3. **Jest + npm workspaces hoisting** — Jest não usa Node module resolution algorithm completo (não sobe árvore). **Fix:** `moduleDirectories: ['node_modules', '<rootDir>/../node_modules']` no `jest.config.js`.

4. **ts-jest warning sobre `module: NodeNext`** — exigia `isolatedModules: true`. Adicionado no `tsconfig.json`.

5. **`baseUrl` deprecated em TS recente** — removido. Paths usam `./` prefixo (não-relative paths exigem baseUrl).

6. **`tsconfig` com paths sem prefixo `./`** — primeiro try falhou com "Non-relative paths are not allowed when 'baseUrl' is not set". Corrigido.

**Verificações finais:**
- `npm run typecheck` (raiz): ✓ passa nos 3 apps
- `npm run lint` (raiz): ✓ zero warnings/errors
- `npm test` (raiz): ✓ backend health.test.ts passa
- `npm run format:check`: ✓ tudo conforme

**Decisão técnica registrada:**
- Lista explícita de entities em `AppDataSource.entities[]` (vazia agora; preenche conforme entities forem criadas) — alinhado com wynk_ecommerce, NÃO usa glob.
- Migrations e subscribers usam **glob** (`src/migrations/**/*.{ts,js}` em dev, `dist/...` em prod) — também alinhado.
- `synchronize: false` — schema gerenciado por migrations apenas.

**Diff:** 40 arquivos. Commit pendente.

Commit: — (a fazer agora)

## 2026-05-08 16:43 — [MARCO] [refactor] Revisão de stack do backend: NestJS → Express + TypeORM cru

**Decisão:** trocar o backend de NestJS pra Express 4 + TypeORM 0.3 antes de iniciar a fase 2. A escolha original (NestJS, registrada em `[MARCO] [decisão] Stack` 14:31) foi feita em vácuo — sem consultar o padrão da casa. Após inspecionar `wynk_ecommerce/backend/`, descobri que **toda a stack Wynk usa Express + TypeORM cru**, não Nest.

**Investigação que motivou a revisão:**
- `wynk_ecommerce/backend/package.json`: express ^4.18.2, typeorm ^0.3.17, jsonwebtoken ^9.0.2, ioredis ^5.8.2, helmet ^7.1.0, cors ^2.8.5, morgan ^1.10.0, dotenv ^16.3.1, pg ^8.11.3, reflect-metadata ^0.1.13, class-validator ^0.14.0, ts-node-dev ^2.0.0.
- 4 services backend (backend, worker, integration, user-microservice) usam **TypeORM em todos**.
- Estrutura padrão: `controllers/`, `services/`, `repositories/`, `routes/`, `entities/`, `migrations/`, `subscribers/`, `middleware/`, `dtos/`, `config/`, `utils/`.
- DataSource em `src/config/database.ts` exportando `AppDataSource` (não `@nestjs/typeorm`).

**Padrões de naming a seguir:**
- Tabelas com prefixo `tb_` (ex: `tb_tenant`, `tb_store`)
- PK = `uuid` (`gen_random_uuid()` ou `uuid_generate_v4()`, detectado via `UuidHelper`)
- Colunas em snake_case com prefixo da entity (ex: `tenant_slug`, `tenant_host`, `tenant_flavor_slug`)
- Property TypeScript em camelCase, mapeamento via `name:` no decorator (`@Column({ name: 'tenant_slug' })`)
- Constraints nomeadas: `pk_tb_X`, `uq_tb_X_<col>`, `fk_tb_X_<col>`
- Migrations: SQL puro via `queryRunner.query()`, schema dinâmico (`${schemaName}.tb_X`), `CREATE TABLE IF NOT EXISTS`
- Schema dedicado configurável via env (no e-commerce é `'ecommerce'`; no SCP será `'scp'`)
- `synchronize: false` (manual via migrations)

**Trade-off aceito:**
- (+) Reuso literal de patterns/helpers do wynk_ecommerce (entities, migrations, helpers tipo `UuidHelper`)
- (+) Time já domina a stack (curva zero)
- (+) PRs mais fáceis de revisar (sem decorators "mágicos" do Nest)
- (+) Sem build step de DI metadata complicado
- (−) Tenant context: middleware Express + `AsyncLocalStorage` (em vez de interceptor Nest) — mais explicito, levemente mais boilerplate
- (−) JWT: `jsonwebtoken` cru + middleware (em vez de `@nestjs/jwt` + Guard) — mais código, mais transparência
- (−) Validação de DTO: `class-validator` standalone (em vez de pipe Nest) — wrapper mínimo
- (−) DI: factory pattern manual (em vez de DI nativa Nest) — disciplina arquitetural depende do time

**Divergência consciente em relação ao wynk_ecommerce:**
- White-label: SCP = Modelo A (build-time, flavor folder); wynk_ecommerce = Modelo B (DB, `tb_white_label_config`). Justificada em `[MARCO] [decisão] White-label Modelo A` (15:33).

**Resposta literal do dev (16:43):** "Podemos mudar para Express?" → após apresentação dos trade-offs (16:43) → "1 - sim / 2 - reescrever só o que for usar / 3 - ok" (manter estrutura inteira do wynk_ecommerce, copiar utilitários só sob demanda, OK pra apagar backend/ atual).

**Decisão técnica registrada:** `[MARCO] [decisão] Stack` (14:31) é **substituída por esta entrada para a parte do backend.** Continuam válidos do 14:31: Next.js App Router (portal), Vite+React (backoffice), npm workspaces, sem Turborepo.

**Implicações em arquivos:**
- `main.md` §Implementação: item `backend/` reescrito (commit pendente).
- `docs/CLAUDE.md`: section Stack do backend reescrita (commit pendente).
- `backend/` (scaffold Nest fase 1) — a apagar e recriar.
- Fase 1 da tabela: marcada como "concluído (com revisão pendente)". Fase 1.5 nova: "Revisão de stack do backend".

Commit: — (a fazer junto com o bootstrap Express).

## 2026-05-08 15:53 — [conclusão] Fase 1 — Bootstrap do monorepo

Bootstrap end-to-end funcional. `npm install` (909 pacotes), `npm run lint/typecheck/test/format:check` passam em todos.

**Arquivos criados na raiz:**
- `package.json` (privado, workspaces: backend/portal/backoffice, scripts agregadores: lint, typecheck, test, build, format, format:check)
- `.gitignore`, `.editorconfig`, `.prettierrc.json`, `.prettierignore`
- `.github/workflows/ci.yml` — CI com matrix `app × task` ([backend, portal, backoffice] × [lint, typecheck, test]) + job `format:check` separado
- `package-lock.json` (consolidado pelo workspace)

**Scaffolds:**
- `backend/` — Nest CLI 11 (`@nestjs/cli@latest new --strict --skip-git --skip-install --package-manager npm`). ESLint flat config (eslint 9 + typescript-eslint 8), Jest 30, TS 5.7. Adicionado script `typecheck`. Fix em `src/main.ts`: `bootstrap()` → `void bootstrap()` (remove warning de floating promise).
- `portal/` — `create-next-app@latest --ts --app --src-dir --no-tailwind --eslint --use-npm --import-alias "@/*" --skip-install`. Next 16.2.6, React 19.2.4. Removido `portal/CLAUDE.md` (era só `@AGENTS.md` e conflitava com a convenção SPEC-driven do repo onde CLAUDE.md vive em `docs/`); mantido `portal/AGENTS.md` (aviso útil sobre breaking changes do Next 15+). Adicionado script `typecheck`.
- `backoffice/` — `create-vite@latest -- --template react-ts`. Vite 8, React 19, TS 6 (sim, TS major 6 — Vite ecosystem foi mais agressivo). Adicionado script `typecheck`.

**White-label — estrutura inicial:**
- `portal/flavors/_default/theme.json` — config completa com cores Slate (primary `#0F172A`, secondary `#64748B`), font Inter, meta padrão, social/contact null
- `portal/flavors/_default/logo.svg` — placeholder SVG com texto "Plataforma"
- `portal/flavors/_default/favicon.ico` — copiado do scaffold do Next (`portal/src/app/favicon.ico`)
- `portal/flavors/README.md` — documentação da convenção (estrutura, princípio, schema de `theme.json`, processo de adicionar tenant)

**Atualizações de docs:**
- `docs/CLAUDE.md` — seção Stack e Comandos atualizadas (pnpm → npm workspaces, white-label Modelo A explicitado)

**Verificações finais:**
- `npm run typecheck`: ✓ passa nos 3
- `npm run lint`: ✓ zero warnings (após fix em main.ts)
- `npm test`: ✓ backend/jest passa (1 spec); portal/backoffice ainda sem testes (com `--if-present` skip)
- `npm run format:check`: ✓ 100% conforme (após adicionar `docs/`, `SKILL.md`, `*.ico` ao `.prettierignore` e rodar `format --write`)

**Decisão técnica registrada nesta entrada:**
- `.prettierignore` exclui `docs/` porque docs SPEC-driven seguem convenção própria (lint-docs.sh) — Prettier formatando markdown poderia bagunçar timestamps e checkboxes.

**Diff:** 64 arquivos (a maioria dos scaffolds). Commit pendente.

Commit: — (a fazer agora)

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
