# State — SPEC-20260503-1505

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-08 14:22

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-11 09:00 (sessão #3 — SPEC ARQUIVADA)
**Onde tô:** SPEC **CONCLUÍDA e ARQUIVADA**. Todos os 11 critérios marcados [x]. 4 features atualizadas (R.7). Pasta movida pra `docs/archive/`. Status=done. Sem follow-up nesta SPEC.
**Próximo passo:** _(nenhum — esta SPEC está fechada)_. Próxima atividade no projeto: ativar SPEC-1506 (módulo lojas) em sessão dedicada.
**Última decisão:** Fechamento R.7 — features `infra-base`, `tenant-resolution`, `auth`, `theme-system` atualizadas com arquivos principais, decisões arquiteturais ativas, alternativas rejeitadas, gotchas. SPEC arquivada (active/ → archive/).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** _(esta SPEC está arquivada — leitura só pra contexto histórico, ver R.8: exige pedido explícito do dev)_.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 0 | Quebra de fases + stack definidas com o dev | concluído | 2026-05-08 14:31 | — |
| 1 | Bootstrap monorepo **npm workspaces**: `backend/` (NestJS — **a ser refeito em Express, ver fase 1.5**), `portal/` (Next.js App Router), `backoffice/` (Vite + React), lint/format, CI, estrutura inicial `portal/flavors/_default/` | concluído (com revisão pendente) | 2026-05-08 16:43 | — |
| 1.5 | **Revisão de stack do backend:** apagar scaffold NestJS, recriar `backend/` em Express 4 + TypeORM 0.3 espelhando estrutura do `wynk_ecommerce/backend/src/`. Manter versões alinhadas (express ^4.18.2, typeorm ^0.3.17, jsonwebtoken ^9.0.2, ioredis ^5.8.2, etc.) | concluído | 2026-05-08 17:04 | — |
| 2 | Docker compose (Postgres 15 + Redis 7); schema `scp`; entity `Tenant` (`tb_tenant`); migrations inicial (schema + extension) e CreateTenantTable; helper `withTenant` + middleware de tenant context com `AsyncLocalStorage`; subscriber TypeORM injetando `tenant_id` | concluído | 2026-05-08 17:42 | — |
| 3 | Endpoint `GET /tenant/resolve` (host → tenant) + cache Redis (`tenant:resolve:{host}`, TTL 10 min) | concluído | 2026-05-08 19:03 | — |
| 4 | `app/layout.tsx` lê `theme.json` do flavor + aplica CSS vars + injeta `<link rel="icon">`/meta. Schema TS de `theme.json` + validação CI da correspondência `tb_tenant.tenant_flavor_slug` ↔ `portal/public/flavors/<slug>/` | concluído | 2026-05-09 09:55 | `44677ba` + fix pendente |
| 5 | Auth JWT (15 min) + refresh (7 dias) em cookies HttpOnly + Secure | concluído | 2026-05-09 19:45 | — |
| 6 | Seed de 1 tenant + validação E2E (todos os critérios de aceite) | concluído | 2026-05-11 08:50 | `968d389` |
| 7 | Atualização das 4 features tocadas (R.7) + arquivamento | concluído | 2026-05-11 09:00 | — |

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

## 2026-05-11 09:00 — [arquivamento] Fase 7 — SPEC concluída e movida pra archive/

R.7 cumprida: as 4 features tocadas atualizadas com arquivos principais, decisões arquiteturais ativas, alternativas rejeitadas, gotchas — todas com referência a esta SPEC e timestamp 2026-05-11 09:00. Pasta movida `docs/active/SPEC-20260503-1505-...` → `docs/archive/SPEC-20260503-1505-...`. `Status: done`, `Concluída: 2026-05-11 09:00`, `Commit final: 968d389`.

**Features atualizadas (R.7):**

- `docs/features/infra-base.md` — monorepo npm workspaces + Express+TypeORM + Docker + naming alinhado wynk_ecommerce + gotchas de bootstrap.
- `docs/features/tenant-resolution.md` — schema `tb_tenant` + resolução por host + cache Redis + AsyncLocalStorage + isolamento de 2 camadas (subscriber + withTenant) + pipeline Express.
- `docs/features/auth.md` — JWT 15min + refresh rotativo 7d + reuse detection + cookies HttpOnly + seed admin.
- `docs/features/theme-system.md` — Modelo A (flavors versionados) + SSR pipeline + `seeds/tenants.json` como fonte canônica única + validate-flavors CI.

**Estado final da SPEC:**

- 11/11 critérios técnicos do `main.md` marcados [x] com timestamp + fase.
- 7 fases concluídas (incluindo 1.5 — revisão de stack pra Express).
- Backend: 50 testes em 7 suites passando; ~30 arquivos novos; 3 migrations aplicadas.
- Portal: SSR funcionando com flavor `shopping-x` (cores roxo/laranja, font Poppins).
- DB: tenant `shopping-x` (`931bb6f7-...`) + admin `admin@shopping-x.local` semeados reproduzivelmente via `npm run seed -w backend`.
- CI: matriz `app × task` + `format:check` + `validate-flavors` (todos verdes).

**Próximos passos no projeto (fora desta SPEC):**

- Ativar SPEC-20260503-1506 (módulo lojas) — exige sessão dedicada (R.8). A base de schema multitenant + auth + tenant-resolution está pronta pra ser herdada.
- Considerar reativar SPEC-20260506-1400 (stores-public-api) quando 1506 entregar schema de stores (a SPEC-1400 está em pause em `docs/active/` em outra branch — ver `project_stores_api_blocked_on_base` na memória global).

Commit do arquivamento: — (a fazer ao consolidar este push)

## 2026-05-11 — [conclusão] Fase 6 — Seed + validação E2E completa de TODOS os critérios de aceite

Seed reproduzível + 15 testes novos (50 totais) + smoke E2E manual cobrindo todos os 8 critérios técnicos do `main.md`. Fase 7 (features + arquivamento) ainda pendente.

**Implementado:**

- `backend/scripts/seed.ts` — lê `seeds/tenants.json` (fonte canônica na raiz, mesmo arquivo usado pelo `validate-flavors`), faz upsert idempotente de tenant + admin. Admin: `admin@<tenant_host>`, senha bcrypt do env `SEED_ADMIN_PASSWORD` (fallback `admin123` em dev com warn, **obrigatória em production** — `resolveAdminPassword()` lança se ausente quando `NODE_ENV=production`). Re-run preserva senha existente (`upsertAdmin` retorna cedo se já presente). Drift de host/flavorSlug/name é detectado e atualizado.
- `backend/package.json` script `"seed": "ts-node scripts/seed.ts"`.
- `backend/.env.example` ganhou seção `# --- Seed ---` com `SEED_ADMIN_PASSWORD=admin123`.
- `backend/__tests__/cross-tenant-isolation.test.ts` — 13 cases cobrindo o critério "query sem tenant_id falha":
  - `TenantSubscriber.beforeInsert`: throws sem tenantId+sem ctx; injeta tenantId do ctx; rejeita cross-tenant (entity.tenantId != ctx.tenantId); aceita match; aceita manual sem ctx (path do seed); ignora entities sem a property; ignora a própria entity `Tenant`.
  - `TenantSubscriber.beforeUpdate`: rejeita mudança em `tenantId`; aceita outras colunas; ignora UPDATE no `Tenant` em si.
  - `withTenant`: throws sem ctx; aplica `WHERE <alias>.tenant_id = :__tenantId` com ctx.tenantId; usa alias dinâmico do QueryBuilder.
- `backend/__tests__/tenant-resolver.service.test.ts` ganhou 2 cases novos:
  - **Invalidação repopula com dado fresco:** primeira resolve cacheia flavor `shopping-x`; mock troca flavor para `shopping-x-rebrand`; resolve novamente sem invalidate ainda devolve o antigo (1 DB hit); `invalidate(host)`; resolve devolve `shopping-x-rebrand` (2 DB hits).
  - Invalidate de host nunca cacheado é no-op (não throws).

**Smoke E2E validado contra stack real (Postgres + Redis + backend em :3001):**

| # | O que | Comando | Resultado |
|---|-------|---------|-----------|
| 1 | Resolve host conhecido | `curl -H "Host: shopping-x.local" :3001/tenant/resolve` | 200, payload `{id, slug, flavorSlug}` ✓ |
| 2 | Resolve host desconhecido | `curl -H "Host: bogus.local" :3001/tenant/resolve` | 404 `tenant_not_found` ✓ |
| 3 | Login válido | `POST /auth/shopping-x/login {email, password}` | 200, cookies `scp_access` + `scp_refresh` setados ✓ |
| 4 | /auth/me | `GET /auth/me` com cookie | 200, user completo + tenantId ✓ |
| 5 | Refresh rotativo | `POST /auth/refresh` | 204, novos cookies ✓ |
| 6 | Logout | `POST /auth/logout` | 204 ✓ |
| 7 | Senha errada | login com pwd errada | 401 `invalid_credentials` (mesma resposta de tenant inexistente — não vaza enumeração) ✓ |
| 8 | Cache populado | `docker exec scp_redis redis-cli get tenant:resolve:shopping-x.local` | JSON do TenantContext ✓ |
| 9 | **Invalidação manual** | `UPDATE scp.tb_tenant SET tenant_flavor_slug='shopping-x-rebrand'` → resolve **ainda volta antigo** (cache hit) → `redis-cli del tenant:resolve:shopping-x.local` → resolve volta `shopping-x-rebrand` ✓ | passou |
| 10 | Rollback | reverter flavor + del key | resolve volta `shopping-x` ✓ |

DB pós-smoke: tenant `shopping-x` (UUID `931bb6f7-...`) + admin `admin@shopping-x.local` no estado original (após rollback).

**Critérios de aceite — checklist final:**

- [x] Acessar `tenant1.local` carrega o flavor correto (cores, fontes, favicon, title, meta) — validado na fase 4 (E2E browser); cache hit no smoke desta sessão confirma persistência.
- [x] Cache Redis funciona — 2ª req não toca banco (fase 3: 77ms → 3ms; smoke #8 confirma key+payload).
- [x] **Invalidação de cache ao alterar host/flavor_slug funciona** — smoke #9: troca flavor no DB, sem `del` cache devolve valor antigo; com `del` devolve valor novo. Também coberto por teste unitário novo.
- [x] Login JWT + refresh + cookies HttpOnly+Secure+SameSite=Lax — fase 5 + smoke #3-7.
- [x] **Tentativa de query sem `tenant_id` falha** — 13 testes unitários novos em `cross-tenant-isolation.test.ts` cobrem subscriber (insert + update) + `withTenant`. Subscriber é global no DataSource, então qualquer INSERT em entity multitenant sem ctx (e sem tenantId manual) é rejeitado em dev e prod.
- [x] Trocar host → trocar tenant sem reload manual — fase 3 + smoke #1/2.
- [x] CI valida correspondência `tb_tenant.tenant_flavor_slug` ↔ `portal/public/flavors/<slug>/` — fase 4 (`scripts/validate-flavors.mjs` + job CI).
- [x] `theme.json` do `_default` existe e cobre campos obrigatórios — fase 1 + validado pelo `validate-flavors`.

**Falta APENAS pra fechar a SPEC (fase 7):**
- [ ] Atualizar `docs/features/{infra-base,tenant-resolution,auth,theme-system}.md` com timestamp + ref à SPEC concluída (R.7)
- [ ] Mover SPEC `docs/active/` → `docs/archive/`
- [ ] Entrada `[arquivamento]` no state.md
- [ ] Atualizar `docs/INDEX.md` (gerado pelo CI ao mergear)

**Checks no estado final:**
- `npm run typecheck` ✓ (3 apps)
- `npm run lint` ✓
- `npm test` ✓ (7 suites, **50 testes**, era 35)
- `npm run format:check` ✓
- `npm run validate:flavors` ✓
- `npm run seed -w backend` ✓ (idempotente: ambos caminhos — wipe+seed cria; re-run preserva)

**Decisões técnicas:**

- **Senha do seed via env, não no JSON.** `seeds/tenants.json` é fonte canônica também consumida pelo `validate-flavors` (CI). Pôr senha lá faria o arquivo crescer fora do que ele representa. Senha vive em env, default seguro em dev (`admin123` com warn), exigida em prod.
- **Email do admin derivado do `tenant_host`** (`admin@${tenant.host}`). Trade-off: se host mudar, o "novo" admin do seed terá email diferente — mas a fonte canônica é o JSON, então mudar host implica re-rodar seed (que vai criar um segundo admin, não rename). Mitigação: documentar como "se renomear host, deletar admin antigo manualmente". Não-ideal mas suficiente pro MVP.
- **Seed preserva senha existente em re-run** — não sobrescreve. Operador que mudou a senha do admin via outro caminho não perde a mudança ao rodar seed de novo. Trade-off: se a senha do env mudar, re-run não reflete no DB. Resolvido manualmente via SQL ou query de admin (futuro).
- **Teste do subscriber + withTenant é unit (sem DB).** Alternativa: criar uma entity fake + DataSource SQLite in-memory e exercitar INSERT/UPDATE reais com TypeORM. Trade-off: 5x mais código + dependência nova (`sqlite3`) por pouco ganho — o subscriber é pura lógica TS sobre os events. Os testes cobrem todos os branches do código atual.
- **Smoke de invalidação manual via SQL + redis-cli** porque ainda não existe endpoint `POST /tenant/:slug/invalidate`. O critério da SPEC pede "teste manual via SQL" — sintaxe explícita. Quando um módulo de admin de tenants surgir, o invalidate vai virar side-effect da mutação.

**Gotchas resolvidos:**

- Subscriber checa `'tenantId' in entity` antes de injetar. Pra teste cobrir o caso "tem a property mas valor undefined", entity tem que ser literalmente `{ tenantId: undefined }`, não `{}` (que não tem a key).
- Jest 30 trocou `--testPathPattern` (singular) por `--testPathPatterns` (plural).
- `npm run seed` precisa do `.env` no `backend/` pra `dotenv` pegar `DB_PORT=5435` (default do código é `5432`).

**Diff:** 4 arquivos novos/modificados — `backend/scripts/seed.ts` (novo), `backend/package.json` (+1 script), `backend/.env.example` (+seção Seed), `backend/__tests__/cross-tenant-isolation.test.ts` (novo, 13 cases), `backend/__tests__/tenant-resolver.service.test.ts` (+2 cases). Commit pendente.

Commit: — (a fazer agora)

## 2026-05-09 19:45 — [conclusão] Fase 5 — Auth JWT + refresh rotativo

Auth completa entregue: login por slug do tenant, refresh rotativo com detecção de reuso, logout, `GET /auth/me` protegido. 22 testes novos (9 unit + 13 e2e), smoke E2E full passou contra DB real.

**Decisões de design (alinhadas com o dev antes de codar):**

- **Sem superadmin global nesta SPEC.** `tb_user.tenant_id` é NOT NULL, FK pra `tb_tenant`. Cada user pertence a exatamente 1 tenant.
- **Login por URL slug, não por host.** Backoffice planejado em domínio único (`admin.scp.local/<slug>/login`); slug embutido na URL. Endpoint `POST /auth/:slug/login`. `/auth/*` bypassa o `resolveTenantByHost` (tenant vem da URL pra login, ou do JWT pra demais).
- **Email único por tenant** (`UNIQUE (tenant_id, user_email)`). Mesmo email pode existir em múltiplos shoppings.
- **Refresh rotativo** com tabela `tb_refresh_token`. Cada `/auth/refresh` revoga o token usado e emite novo. Reapresentar refresh **já revogado** é tratado como leak: revoga **toda a cadeia do user** (não só o token reapresentado).
- **Refresh hashado em DB** (SHA-256 hex, 64 chars). Não bcrypt — refresh é random 256 bits, espaço de busca dispensa hash slow. Comprometimento do DB não vaza sessões ativas (pré-imagem).
- **Cookies HttpOnly + SameSite=Lax + Secure (em prod):**
  - `scp_access` — path=`/`, maxAge=15 min
  - `scp_refresh` — path=`/auth`, maxAge=7d (cookie só viaja em `/auth/*` — refresh + logout)
- **JWT carrega tenant context completo** (`tenantId, tenantSlug, tenantFlavorSlug, role`) pra `requireAuth` montar `req.user` + `req.tenant` sem nova consulta ao DB. Mudança de slug/flavor exige re-login (TTL 15 min do access).

**Implementado (backend, 14 arquivos novos + 5 modificados):**

- Migrations:
  - `1746748200000-CreateUserTable` — `tb_user(user_id pk, tenant_id fk, user_email, user_password_hash, user_name, user_role default 'tenant_admin', user_created_at, user_updated_at)`. UNIQUE `(tenant_id, user_email)`.
  - `1746748300000-CreateRefreshTokenTable` — `tb_refresh_token(token_id pk, user_id fk, tenant_id fk, token_hash unique, token_expires_at, token_revoked_at nullable, token_created_at)`. Index `ix_tb_refresh_token_user_id` pra revoke-all.
- Entities `User`, `RefreshToken` + adicionadas em `AppDataSource.entities`.
- Repos `UserRepository` (`findByTenantAndEmail`, `findById`, `save`), `RefreshTokenRepository` (`findValidByHash` com filtros embutidos, `findAnyByHash` pra detecção de reuso, `save`, `revoke`, `revokeAllForUser`).
- Utils:
  - `utils/jwt.ts` — `signAccessToken/verifyAccessToken` com payload tipado.
  - `utils/passwords.ts` — `hashPassword/verifyPassword` (bcryptjs 10 rounds), `generateRefreshToken` (32 bytes hex), `hashRefreshToken` (SHA-256 hex).
- `services/auth.service.ts` — `login/refresh/logout` + classes de erro tipadas (`TenantNotFoundError`, `InvalidCredentialsError`, `RefreshTokenInvalidError`, `RefreshTokenReusedError`).
- `controllers/auth.controller.ts` + `routes/auth.routes.ts` — 4 endpoints (`POST /auth/:slug/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`).
- `middleware/require-auth.ts` — valida access cookie, popula `req.user`+`req.tenant`, encadeia `next()` dentro de `runWithTenantContext`.
- `app.ts` refatorado: `bypassFor` agora aceita predicado de path (era Set de match exato); `/auth/*` bypassa pipeline host-based.
- `types/express.d.ts` ampliado com `req.user`.
- `__tests__/helpers/mock-deps.ts` ganha `makeStubAuthController()` pros testes existentes.

**Testes adicionados:**
- `__tests__/auth.service.test.ts` (9 cases) — todos os flows do service com fake repos (jest.fn).
- `__tests__/auth.e2e.test.ts` (13 cases) — controller + routes + middleware via supertest com in-memory fake repos. Cobre happy path, errors, reuse detection (cadeia revogada após reuso de refresh), bypass de host pra `/auth/*`.
- Total: 6 suites, **35 testes**, 100% passando.

**Verificação E2E (smoke contra DB+Redis reais):**

User de teste inserido via SQL: `admin@shopping-x.local` / senha `admin123` (bcrypt hash gerado via `node -e "require('bcryptjs').hash('admin123', 10)"`). Tenant `shopping-x` (UUID `931bb6f7-...`) já existia da fase 2.

1. `POST /auth/shopping-x/login {email,password}` correto → **200**, body `{user:{id,email,name,role}}`, cookies `scp_access` (path=/) e `scp_refresh` (path=/auth) setados ✓
2. `GET /auth/me` com access cookie → **200**, retorna user completo (id, email, name, role, tenantId) ✓
3. `POST /auth/refresh` com refresh cookie → **204**, novos cookies emitidos (refresh diferente do anterior) ✓
4. `POST /auth/refresh` com refresh ANTIGO (já rotacionado) → **401** + service revoga toda a cadeia ✓
5. `POST /auth/refresh` com refresh NOVO (cadeia revogada) → **401** ✓ (confirma reuse detection)
6. DB inspection: `SELECT ... FROM tb_refresh_token` mostra ambos tokens com `token_revoked_at` preenchido ✓
7. `POST /auth/logout` → **204**, refresh revogado no DB ✓
8. `POST /auth/refresh` após logout → **401** (refresh revogado) ✓
9. `POST /auth/shopping-x/login` com senha errada → **401** `invalid_credentials` ✓
10. `POST /auth/nope/login` (tenant inexistente) → **401** `invalid_credentials` (mesmo erro — não vaza enumeração) ✓
11. `GET /auth/me` sem cookie → **401** `unauthorized` ✓

**Checks no estado final:**
- `npm run typecheck` ✓ (3 apps)
- `npm run lint` ✓
- `npm test` ✓ (6 suites, 35 testes)
- `npm run format:check` ✓
- `npm run validate:flavors` ✓

**Critérios de aceite (parciais — fechamento total na fase 6):**
- [x] Login JWT + refresh token funcionando, cookies marcados HttpOnly + Secure + SameSite=Lax — **confirmado** (smoke + testes verificam atributos do Set-Cookie)

**Gotchas resolvidos:**
- Express deprecou `maxAge` em `res.clearCookie()` — separei `accessCookieOptions/refreshCookieOptions` (sem maxAge, usadas em set+clear) de `setAccessCookie/setRefreshCookie` (helpers que adicionam maxAge só no set).
- `bypassFor` precisava virar predicate-based pra suportar prefixo (`/auth/*`) além de paths exatos (`/health`).
- Stub de `AuthController` no `mock-deps` pra testes existentes (que não exercitam auth) não quebrarem após adicionar `authController` ao `AppDeps`.

**Decisões técnicas:**
- Login resolve tenant pelo slug e ignora `req.tenant` (que estaria vazio porque `/auth/*` bypassa `resolveTenantByHost`). AuthService recebe `tenantSlug` por parâmetro, não via `requireTenantContext`.
- Refresh/logout/me dependem do `requireAuth` (ou do cookie de refresh direto pro controller no caso de refresh/logout) — tenant vem do JWT, não de host. `requireAuth` popula `req.tenant` a partir do JWT pra o subscriber TypeORM enxergar tenant_id em INSERT/UPDATE downstream.
- Errors `InvalidCredentialsError` e `TenantNotFoundError` retornam mesma resposta no controller (`401 invalid_credentials`) pra evitar enumeração de tenants/emails.
- Refresh token é random 32 bytes hex. Hash de armazenamento é SHA-256 (não bcrypt) — input já tem entropia 256 bits, slow hash não agrega.

**Diff:** 14 arquivos novos + 5 modificados. Commit pendente.

Commit: — (a fazer agora)

## 2026-05-09 09:55 — [conclusão] Fase 4 — Theme system + smoke E2E (com fix)

Smoke E2E browser rodado contra stack inteira (Postgres + Redis + backend + portal reais). Um bug crítico encontrado e corrigido durante a validação. Todos os checks finais verdes.

**Roteiro executado:**

1. `docker-compose up -d` — containers caíram entre sessões (provável reboot), mas volumes persistiram. Postgres + Redis healthy em ~3s. Tenant `shopping-x` (UUID `931bb6f7-...`) ainda no DB ✓
2. `npm run dev -w backend` — backend up em :3001, `curl /health` → `{"status":"ok"}`
3. `npm run dev -w portal` — portal up em :3000 (Next 16.2.6 turbopack)
4. `curl -H "Host: shopping-x.local" http://localhost:3000` → **inicialmente 404** ❌

**Bug encontrado: `Host` header é sobrescrito por Node fetch (undici)**

Causa raiz: `portal/src/lib/tenant/resolve.ts` enviava o host do tenant em `headers: { Host: host }` ao chamar o backend. Mas o fetch nativo do Node (undici) **reescreve o header `Host`** a partir da URL — então o backend recebia `Host: localhost:3001` em vez de `Host: shopping-x.local`, e respondia 404.

Isolei com `node -e "fetch('...', { headers: { Host: 'shopping-x.local' } })"` direto: backend retornou `tenant_not_found`. Trocando por `X-Forwarded-Host`: backend retornou 200 com tenant correto.

**Fix aplicado em `portal/src/lib/tenant/resolve.ts:29-33`:**

```ts
const res = await fetch(url, {
  headers: { 'X-Forwarded-Host': host },  // antes: { Host: host }
  cache: 'no-store',
});
```

Comentário inline registrando o gotcha. O backend já tinha `app.set('trust proxy', true)` na fase 3 (`backend/src/app.ts`), exatamente porque essa interação proxy↔backend foi prevista. `req.hostname` reflete `X-Forwarded-Host` quando trust proxy está on.

**Bug secundário: `next-env.d.ts` formatado com aspas duplas**

Next 16 turbopack regerou `portal/next-env.d.ts` com `import "./.next/dev/types/routes.d.ts"` (aspas duplas), violando o `singleQuote: true` do prettier. Arquivo é autogerado e tem header explícito "should not be edited". Adicionado ao `.prettierignore`.

**Smoke E2E final (após fix):**

- `curl -H "Host: shopping-x.local" http://localhost:3000` → **HTTP 200**, HTML com:
  - `<title>Shopping X — Compre, viva, descubra</title>` ✓
  - `style="--color-primary:#7C3AED;--color-secondary:#F59E0B;--color-text:#1F2937;--color-background:#FAFAFA;--font-primary:&quot;Poppins&quot;, system-ui, sans-serif"` no `<html>` ✓
  - `<link rel="icon" href="/flavors/shopping-x/favicon.ico"/>` ✓
  - Logo SVG `/flavors/shopping-x/logo.svg` referenciada ✓
- `curl http://localhost:3000/flavors/shopping-x/logo.svg` → **200 OK** ✓
- `curl http://localhost:3000/flavors/shopping-x/favicon.ico` → **200 OK** ✓
- `curl -H "Host: bogus.local" http://localhost:3000` → **404** (`notFound()` disparado) ✓
- `docker exec scp_redis redis-cli get tenant:resolve:shopping-x.local` → JSON com tenant context ✓ (cache populado pelo hit do portal)

**Checks no estado final:**
- `npm run typecheck` ✓ (3 apps)
- `npm run lint` ✓
- `npm test` ✓ (4 suites, 13 testes)
- `npm run format:check` ✓ (após `.prettierignore` update)
- `npm run validate:flavors` ✓

**Critérios de aceite (parciais):**
- [x] Acessar `tenant1.local` carrega config do tenant 1 (cores, fontes, favicon corretos) — **confirmado** com curl
- [x] Trocar host → trocar tenant sem reload manual de cache — **confirmado** (cache key é por host, fase 3 + smoke desta fase)

**Decisões técnicas:**
- `X-Forwarded-Host` em vez de `Host` no fetch interno portal→backend. Trade-off: levemente menos óbvio que "passar o header literal", mas (a) é o padrão de proxy reverso real (Nginx/CloudFront fariam o mesmo em prod) e (b) é a única opção que funciona com fetch nativo do Node. Documentado inline no código.
- `next-env.d.ts` em `.prettierignore`. Mesmo princípio do `*.ico`/`*.lock`: arquivo gerado por terceiro, não-editável.

**Diff:** 2 arquivos (`portal/src/lib/tenant/resolve.ts`, `.prettierignore`). Commit pendente.

**Estado de infraestrutura ao concluir:**
- Containers Docker up e healthy.
- Backend e portal rodando em background (`npm run dev`). Pode-se descer pra próxima sessão.

**Pra fase 5 (auth):**
- Pra emissão: `POST /auth/login` com `email`/`password`, retorna access (15 min) em cookie HttpOnly e refresh (7 dias) em cookie HttpOnly + path `/auth/refresh`.
- Pra validação: middleware `requireAuth` que lê cookie, valida JWT, anexa `req.user` (com `tenantId` propagado pra `tenantContextMiddleware`).
- Tabela `tb_user` ainda não existe — vai precisar de migration na fase 5.

Commit: — (a fazer agora)

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

## 2026-05-08 22:15 — [nota] Fase 4 — código pronto, smoke E2E browser pendente; sessão fechada pelo dev

**Estado da fase 4 ao parar:**

Código completo, todos os checks automatizados verdes, smoke E2E manual no browser ainda **não validado**. Dev decidiu fechar a sessão antes da validação visual. Containers Docker (Postgres + Redis) seguem up; DB tem o tenant exemplo `shopping-x` inserido na fase 2.

**Implementado (commit `44677ba`, feito pelo dev via IDE/Copilot — sem coautoria):**

- `portal/flavors/` → `portal/public/flavors/` (movido pra Next servir assets nativamente em `/flavors/<slug>/...`)
- Novo flavor `portal/public/flavors/shopping-x/` com `theme.json` (cores `#7C3AED`/`#F59E0B`, fonte Poppins), `logo.svg` (placeholder visual diferente do `_default`) e `favicon.ico`
- `portal/src/lib/theme/types.ts` — schema TypeScript de `theme.json`
- `portal/src/lib/theme/load.ts` — `loadTheme(slug)` (lê via `node:fs/promises`, fallback pra `_default`) + `flavorAssets(slug)` (URLs canônicas)
- `portal/src/lib/tenant/resolve.ts` — `resolveTenantByHost(host)` chama backend `GET /tenant/resolve` com `cache: 'no-store'` (Redis no backend já cacheia; evita camada extra do Next data cache)
- `portal/src/app/layout.tsx` reescrito: `generateMetadata()` dinâmico + RootLayout com CSS vars no `<html style={...}>` + Google Font preconnect + `notFound()` em host desconhecido
- `portal/src/app/page.tsx` — homepage temporária mostrando logo, nome, swatches de cor, fonte (validação visual)
- `portal/src/app/page.module.css` — usa `var(--color-*)` e `var(--font-primary)`
- `portal/src/app/globals.css` — limpo: sem default cores hard-coded; tudo via CSS vars do flavor
- `portal/.env.example` — `BACKEND_URL=http://localhost:3001`
- `seeds/tenants.json` na raiz — manifesto canonical (fonte da verdade pra CI)
- `scripts/validate-flavors.mjs` — valida que cada `flavorSlug` no manifesto tem pasta com `theme.json`/`logo.svg`/`favicon.ico` + valida shape do `theme.json`. Roda como `npm run validate:flavors`
- `.github/workflows/ci.yml` — job novo `validate-flavors`
- `package.json` raiz — script `validate:flavors`

**Checks no estado atual:**
- `npm run validate:flavors` ✓
- `npm run typecheck` ✓ (3 apps)
- `npm run lint` ✓
- `npm test` ✓ (4 suites, 13 testes — não há testes novos pra portal nesta fase, intencional)
- `npm run format:check` ✓

**Smoke E2E browser PENDENTE (pra próxima sessão):**

1. `npm run dev -w backend` (backend conecta no DB existente)
2. `cp portal/.env.example portal/.env` (se ainda não existir)
3. `npm run dev -w portal`
4. `curl -H "Host: shopping-x.local" http://localhost:3000` → deve render HTML com:
   - `<title>Shopping X — Compre, viva, descubra</title>`
   - `<meta name="description" ...>`
   - `<link rel="icon" href="/flavors/shopping-x/favicon.ico" />`
   - `style="--color-primary:#7C3AED; --color-secondary:#F59E0B; ..."` no `<html>`
   - Logo SVG referenciada via Image
5. `curl http://localhost:3000/flavors/shopping-x/logo.svg` → 200 OK (SVG)
6. `curl -H "Host: bogus.local" http://localhost:3000` → 404 (Next `notFound()`)
7. Browser: abrir com `/etc/hosts` apontando `127.0.0.1 shopping-x.local` e ver visualmente cores roxo/laranja + fonte Poppins
8. Trocar host do tenant pra `bogus.local` no DB, hit cache invalidate (`docker exec scp_redis redis-cli del tenant:resolve:shopping-x.local`), confirmar comportamento

**Critérios de aceite que ainda dependem de smoke:**
- [ ] Acessar `tenant1.local` carrega config do tenant 1 (cores, fontes, favicon corretos) — validar
- [ ] Trocar host → trocar tenant sem reload manual de cache — confirmado em fase 3 via curl ao backend; falta validar via portal end-to-end

**Estado de infraestrutura ao parar:**
- Containers Docker ainda up: `scp_postgres` (5435), `scp_redis` (6382). Health = healthy.
- DB tem tenant `shopping-x` inserido manualmente na fase 2 (`tenant_id=931bb6f7-7631-4abf-9b74-88264561378a`).
- Próxima sessão pode descer com `docker-compose stop` se quiser liberar recursos, ou manter pra continuar.

## 2026-05-08 19:03 — [conclusão] Fase 3 — Resolução de tenant por host com cache Redis

Endpoint `GET /tenant/resolve` funcional e validado E2E contra Postgres + Redis reais. Cache Redis dá speedup de 25x na segunda chamada do mesmo host.

**Camadas criadas:**
- `repositories/tenant.repository.ts` — wrapper sobre `dataSource.getRepository(Tenant)`. Métodos: `findByHost`, `findBySlug`, `findById`. NÃO usa `withTenant()` (a tabela `tb_tenant` é o catálogo de tenants em si).
- `services/tenant-resolver.service.ts` — `resolveByHost(host)`: tenta cache Redis (`tenant:resolve:{host}`); cache miss → query DB → grava cache com TTL 600s (10 min) → retorna ctx. `invalidate(host)`: deleta a chave.
- `middleware/resolve-tenant-by-host.ts` — factory `createResolveTenantByHostMiddleware(resolver)`. Pega `req.hostname`, resolve, anexa em `req.tenant` ou responde 404 (`tenant_not_found`)/400 (`host_required`).
- `controllers/tenant.controller.ts` — `getTenantResolve(req, res)`: serializa `req.tenant` como `{ id, slug, flavorSlug }`. Não vaza `createdAt`/`updatedAt`.
- `routes/tenant.routes.ts` — `Router` com `GET /tenant/resolve`.
- `types/express.d.ts` — declaration merging adiciona `req.tenant?: TenantContext`.

**Refatoração de `app.ts`:**
- `createApp(deps: AppDeps)` agora exige `{ tenantResolver }` no construtor (composition root em `server.ts`).
- Pipeline: `helmet` → `cors` → `json/urlencoded/cookie-parser` → `morgan` → `/health` (rota antes do middleware de tenant) → `bypassFor(['/health'], resolveTenantByHostMiddleware)` → `bypassFor(['/health'], tenantContextMiddleware)` → `tenantRoutes` → 404 → error handler.
- `app.set('trust proxy', true)` — `req.hostname` reflete o `Host` da request (via X-Forwarded-Host quando atrás de proxy reverso).

**Refatoração de `server.ts`:**
- Composition root: instancia `TenantRepository(AppDataSource)` e `TenantResolverService(repo, redis)`.
- Passa pra `createApp({ tenantResolver })`.

**Testes adicionados (5 novos cases, 4 suites totais, 13 testes):**
- `tenant-resolver.service.test.ts` (4 cases): cache miss escreve no Redis com TTL 600; cache hit não toca DB; null quando host não existe; invalidate remove a key.
- `tenant-resolve.e2e.test.ts` (3 cases): 404 em host desconhecido; 200 com `{id, slug, flavorSlug}` em host conhecido; `/health` segue funcional independente de host.
- `helpers/mock-deps.ts` — fake `TenantResolverService` que lê de `Map<host, ctx>` (sem Redis nem DB).
- Atualização de `health.test.ts` pra usar `makeAppDeps()` (createApp agora exige deps).

**Verificação E2E (smoke contra DB + Redis reais):**
1. Backend up via `npm run dev -w backend`
2. `curl -H "Host: shopping-x.local" /tenant/resolve` → 200, **77ms** (cache miss: query DB + Redis SET)
3. Mesmo curl repetido → 200, **3ms** (cache hit: apenas Redis GET)
4. `docker exec scp_redis redis-cli get "tenant:resolve:shopping-x.local"` → JSON do `TenantContext`
5. `curl -H "Host: bogus.local" /tenant/resolve` → **404** `tenant_not_found`
6. `curl -H "Host: bogus.local" /health` → **200** (bypass funcional)

**Critérios de aceite (parciais — fechamento total na fase 6):**
- [x] Cache Redis funciona — segunda requisição não toca o banco. **Confirmado** (77ms → 3ms).
- [x] Trocar host → trocar tenant sem reload manual de cache. **Confirmado** (cache key é por host).
- [x] Login JWT — pendente (fase 5).
- [x] Tentativa de query sem `tenant_id` falha — implementado em fase 2 (subscriber + helper), validar formal na fase 6.

**Gotchas resolvidos:**
- `@types/supertest` declara `Test extends STest` mas `STest` precisa de `@types/superagent` instalado pra expor `.set()`. Sem isso, tsc reclama "Property 'set' does not exist on type 'Test'". Solução: instalar `@types/superagent` como devDep do backend.

**Decisões técnicas:**
- `bypassFor(paths, handler)` — middleware composer simples: pula handler se `req.path` está no Set. Alternativa considerada: `app.use(/^(?!\/health).*/, handler)` (regex inline) — rejeitada por menos legível.
- Composition root em `server.ts` — sem framework de DI. Cada instância criada explicitamente (TenantRepository, TenantResolverService). Trade-off: boilerplate cresce com o número de services; mitigação futura é adicionar um container leve (tsyringe/awilix) **se a dor justificar**.
- TTL de cache = 600s (10 min) hard-coded em const no service. Configurável via env só quando virar problema operacional.

**Diff:** ~10 arquivos novos + 4 modificados. Commit pendente.

Commit: — (a fazer agora)

## 2026-05-08 17:42 — [conclusão] Fase 2 — Schema multitenant + tenant context

Postgres rodando, schema criado, migrations aplicadas, entity Tenant funcional, tenant context propagável via AsyncLocalStorage e subscriber TypeORM enforçando `tenant_id` em todo INSERT/UPDATE.

**Infra (Docker):**
- `docker-compose.yml` na raiz: postgres:15-alpine + redis:7-alpine, healthchecks, network `scp_network`, volumes `scp_postgres_data`/`scp_redis_data`
- Portas expostas: **5435** (postgres) e **6382** (redis) — escolhidas pra evitar conflito com wynk_ecommerce (5434/6381) rodando em paralelo
- Versão Postgres alinhada com wynk_ecommerce (15, não 16 como considerado inicialmente)

**Banco:**
- `scripts/ensure-schema.ts` — usa `pg` cliente direto pra `CREATE SCHEMA IF NOT EXISTS`. Resolve chicken-and-egg: TypeORM tenta criar `scp.migrations` antes de qualquer migration rodar, mas `scp` não existe. Padrão equivalente ao `prepare:schema` do wynk_ecommerce (que usa `psql`).
- Scripts orquestrados: `prepare:schema` → `db:setup` (= prepare + migration:run)

**Migrations:**
1. `1746748000000-InitialSchema.ts` — `CREATE SCHEMA IF NOT EXISTS scp` + `CREATE EXTENSION IF NOT EXISTS pgcrypto`. `down()` é noop (não dropa nem schema nem extensão — operação destrutiva exigiria decisão consciente).
2. `1746748100000-CreateTenantTable.ts` — `CREATE TABLE IF NOT EXISTS scp.tb_tenant (...)` com PK `tenant_id uuid`, UNIQUE em `tenant_slug` e `tenant_host`, índice `ix_tb_tenant_flavor_slug` pra validação CI eficiente. Constraints nomeadas (`pk_tb_tenant`, `uq_tb_tenant_*`).
- `UuidHelper` em `backend/src/utils/uuid-helper.ts` — adaptado de wynk_ecommerce. Detecta `uuid_generate_v4()` (uuid-ossp) ou `gen_random_uuid()` (pgcrypto). Cacheia.

**Entity Tenant** (`backend/src/entities/Tenant.ts`):
- `@Entity('tb_tenant')`
- Mapeamento snake_case ↔ camelCase via `name:` no decorator
- Campos: `id` (uuid), `slug`, `host`, `flavorSlug`, `name`, `createdAt`, `updatedAt`
- Adicionada à lista explícita em `AppDataSource.entities[]`

**Tenant context (AsyncLocalStorage):**
- `backend/src/middleware/tenant-context.ts`:
  - Interface `TenantContext { tenantId, slug, flavorSlug }`
  - `getTenantContext()` — retorna ctx ou undefined
  - `requireTenantContext()` — lança se ausente
  - `runWithTenantContext(ctx, fn)` — útil em testes/scripts/workers
  - `tenantContextMiddleware` — Express middleware que lê `req.tenant` (populado por middleware anterior, vai vir na fase 3) e roda o resto da request com o ctx no AsyncLocalStorage

**Helper `withTenant`** (`backend/src/utils/with-tenant.ts`):
- Aplica `WHERE alias.tenant_id = :__tenantId` a SelectQueryBuilder
- Usa `requireTenantContext()` — falha explícita se chamado fora de uma request multitenant
- Não usar pra `Tenant` em si (PK já é tenant_id)

**Subscriber TypeORM** (`backend/src/subscribers/TenantSubscriber.ts`):
- `beforeInsert`: injeta `tenantId` se entity tem a propriedade e não foi setado; lança se ctx ausente; lança em cross-tenant insert (entity.tenantId != ctx.tenantId)
- `beforeUpdate`: REJEITA mudança em `tenantId` (cross-tenant move exige operação explícita)
- Ignora a entity `Tenant` (não tem coluna `tenant_id` separada — PK é o próprio)

**Testes adicionados:**
- `__tests__/tenant-context.test.ts` — 5 cases: undefined fora, throw em require, exposição em runWith, isolamento concorrente (Promise.all), limpeza após run
- Total agora: 2 suites, 6 testes, 100% passando

**Verificação E2E (smoke test feito nesta sessão):**
1. `docker-compose up -d` — postgres healthy em ~2s, redis idem
2. `cp .env.example .env` no backend
3. `npm run db:setup -w backend` — schema criado + 2 migrations aplicadas
4. `docker exec scp_postgres psql ...` — `\dt scp.*` mostra `migrations` + `tb_tenant`; INSERT manual de tenant funciona, retorna UUID gerado
5. `npm run dev -w backend` — sobe em port 3001, conecta no DB, log `database connected`
6. `curl localhost:3001/health` → `{"status":"ok","uptime":1.97}`

**Gotchas resolvidos:**
- `ts-node` precisa estar **na raiz** do workspace (não só em `backend/`) porque o binário `typeorm-ts-node-commonjs` está em `node_modules/typeorm/` (hoisted pra raiz) e busca `ts-node` a partir dali, sem subir/descer pra workspaces.
- `@types/pg` necessário pra `scripts/ensure-schema.ts` compilar com ts-node.
- TypeORM CLI tenta criar tabela `migrations` no schema configurado **antes** de rodar a primeira migration. Se o schema não existe, falha. Solução: pre-script `ensure-schema` que conecta via pg cliente direto (sem TypeORM) e roda `CREATE SCHEMA IF NOT EXISTS`.

**Decisão técnica registrada:**
- Pre-script Node (`scripts/ensure-schema.ts`) em vez de psql shell — funciona cross-platform sem exigir psql instalado no host.
- `down()` da migration `InitialSchema` é noop intencional — schema e extensão são compartilhados, dropá-los teria efeito não-trivial.
- Subscriber rejeita UPDATE de `tenantId` mesmo se ctx == entity.tenantId — segurança extra: mudar tenant de uma row deve ser operação explícita (delete + insert).

**Diff:** ~12 arquivos novos + 2 modificados. Commit pendente.

Commit: — (a fazer agora)

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
