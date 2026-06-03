# State — SPEC-20260603-1149

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-03 12:16

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-03 17:58
**Onde tô:** TODAS as fases de implementação feitas (backend + testes + UI), tudo verde (backend: typecheck+lint+146 testes; backoffice: lint+typecheck+build). Migration NÃO rodada; NADA commitado.
**Próximo passo:** ciclo de conclusão (R.5.3 + R.7) — atualizar features superadmin/auth/tenant-resolution, marcar critérios de aceite no main.md, commitar e arquivar (active/→archive/) NO MESMO PR. Aguarda decisão do dev (commit + migration).
**Última decisão:** auth superadmin opção (a); `posts_count`=notícias (2026-06-03 14:00).
**Bloqueio atual:** conclusão depende de commits (R.6 exige hash) e de o dev rodar a migration. Sem isso, não arquivar.
**Se retomar, ler:** este TL;DR + tabela de fases + entrada de log de 2026-06-03 17:58.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Migration: `tenant_status` + `tenant_deleted_at` + `tb_user.tenant_id` nullable | concluído (código; migration:run pendente) | 2026-06-03 13:42 | _(commit pendente)_ |
| 2 | Entities: `Tenant.status/deletedAt`, `User` superadmin/nullable | concluído (typecheck verde) | 2026-06-03 13:42 | _(commit pendente)_ |
| 3 | Middleware `requireSuperadmin` | concluído (typecheck verde) | 2026-06-03 13:49 | _(commit pendente)_ |
| 4 | Service (transação create, unicidade, agregações sem N+1) | concluído (typecheck verde) | 2026-06-03 14:04 | _(commit pendente)_ |
| 5 | Controller real (substituir mock) + validação + rotas sob auth + tolerância superadmin no requireAuth | concluído (typecheck+lint+116 testes verdes) | 2026-06-03 14:55 | _(commit pendente)_ |
| 5b | Login de superadmin (emitir JWT sem tenant) + seeding + isentar superadmin no TenantSubscriber | concluído (typecheck+lint+116 testes verdes) | 2026-06-03 16:21 | _(commit pendente)_ |
| 6 | Invalidação cache `tenant:resolve:{host}` + logs de auditoria | concluído (no service, Fase 4) | 2026-06-03 14:55 | _(commit pendente)_ |
| 7 | UI backoffice `/admin/tenants` (tabela + criação multi-step + guarda de papel) | concluído (lint+typecheck+build verdes) | 2026-06-03 17:58 | _(commit pendente)_ |
| 8 | Testes do CRUD superadmin (409 unicidade, 403 papéis, soft-delete, login) | concluído (146 testes verdes; +30) | 2026-06-03 17:17 | _(commit pendente)_ |
| 9 | Atualizar features + arquivar (R.5.3 + R.7) | pendente | 2026-06-03 12:16 | — |

Status permitidos: `pendente` | `em progresso` | `concluído` | `bloqueado` | `descartado`.

### Próximos passos

- [ ] Rodar `npm run migration:run -w backend` localmente (dev) e validar up/down
- [ ] Fase 3: middleware `requireSuperadmin`

### Bloqueios ativos

_nenhum_

---

## Fatos confirmados

- [2026-06-03 12:16] `tb_tenant` NÃO tem coluna de status nem `deleted_at`. Fonte: `backend/src/entities/Tenant.ts`.
- [2026-06-03 12:16] Branding proibido no banco (Modelo A, build-time em `portal/flavors/<slug>/`). Fonte: docstring de `Tenant.ts` + `docs/CLAUDE.md:Stack`.
- [2026-06-03 12:16] `User` exige `tenant_id` e índice único `(tenant_id, email)`; docstring diz "sem superadmin global nesta SPEC". Fonte: `backend/src/entities/User.ts`.
- [2026-06-03 12:16] Não existe papel/identidade `superadmin` nem middleware correspondente; só `require-tenant-admin.ts` (aceita `tenant_admin`/`admin`) e `require-auth.ts`. Fonte: `backend/src/middleware/`.
- [2026-06-03 12:16] Controller `superadminTenantController.ts` é mock em memória (`mockTenantsDb`/`mockUsersDb`), com dados hardcoded ("Brasilia Shopping"). Fonte: `backend/src/controllers/superadminTenantController.ts`.
- [2026-06-03 12:16] Chave de cache real é `tenant:resolve:{host}` (TTL 10 min). Fonte: `docs/CLAUDE.md:Stack`.
- [2026-06-03 12:16] Não existe entidade `audit_log` no schema. Fonte: `backend/src/entities/` (ls).

## Inferências prováveis

- [2026-06-03 12:16] Com `tenant_id` nullable em `tb_user`, o índice único `(tenant_id, email)` deixa de impedir 2 superadmins com mesmo email (NULL não colide em índice Postgres). Validar com: avaliar índice parcial `WHERE user_role = 'superadmin'` na migration.
- [2026-06-03 12:16] `posts_count` provavelmente agrega `tb_news` (+ eventos?); `stores_count` agrega `tb_store`. Validar com: definição de "posts" no dashboard (SPEC-20260531-1400).

## Dúvidas em aberto

- [2026-06-03 13:42] "posts_count" inclui notícias + eventos + promoções, ou só notícias? Próxima ação: alinhar com a definição do dashboard (relevante só na Fase 4). RESOLVER antes de implementar a agregação.
- [2026-06-03 13:49] **[MARCO] Como o superadmin autentica?** `requireAuth` deriva `TenantContext` do JWT (`payload.tenantId/tenantSlug/tenantFlavorSlug`) e embrulha `next()` em `runWithTenantContext`. Superadmin não tem tenant → o JWT e o fluxo de auth precisam tolerar isso, OU as rotas superadmin usam um auth diferente (sem `runWithTenantContext`). Próxima ação: decidir na Fase 5 (wiring) junto com o login de superadmin (toca feature `auth` e `tenant-resolution`). Provável: `requireAuth` aceitar payload sem tenant e NÃO abrir contexto quando role=superadmin; emissão de JWT de superadmin no `auth.service`.

## Dúvidas resolvidas

- [2026-06-03 13:42] ~~Prefixo das rotas admin~~ → RESOLVIDO: `createSuperadminRoutes()` é montado sob `/api` em `app.ts:91`, e o route file define `/superadmin/tenants`. Caminho efetivo = `/api/superadmin/tenants` (igual ao material). Manter `/superadmin/...` no route file. Fonte: `backend/src/app.ts:91`.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-06-03 12:16 — [ativação]

SPEC ativada (movida de `future/` → `active/`) na branch `feature/SQU-72-SuperadminCRUD-de-tenants`. Contrato (`main.md`) validado pelo usuário.

Origem: ticket SQU-72; escopo fatiado de SPEC-20260503-1509 §7.1. Material de origem veio em formato Next.js e foi traduzido para Express+TypeORM.

Duas decisões de arquitetura confirmadas pelo usuário (2026-06-03 11:49), registradas no `main.md:Implementação`:
1. Branding via `flavor_slug` (default `'default'`), nunca cores no banco — preserva Modelo A.
2. Superadmin = papel `superadmin` em `tb_user` com `tenant_id` nullable — reaproveita auth/refresh-token; rejeitada tabela `tb_superadmin` separada.

Plano: 9 fases (ver tabela). Começar pela migration (Fase 1), pois nada do resto tem onde gravar sem `tenant_status`/`tenant_deleted_at`.

Arquivos relevantes mapeados: `entities/Tenant.ts`, `entities/User.ts`, `middleware/require-tenant-admin.ts` (modelo p/ `requireSuperadmin`), `controllers/superadminTenantController.ts` (mock a substituir), `routes/superadmin.routes.ts`, `utils/tenantValidator.ts` (stub), `backoffice/src/pages/tenants/TenantsPage.tsx` (stub).

## 2026-06-03 13:42 — [descoberta] Prefixo de rota já é `/api/superadmin`

`createSuperadminRoutes()` é montado com `app.use('/api', ...)` em `app.ts:91`; o route file usa `/superadmin/tenants`. Logo o caminho efetivo já é `/api/superadmin/tenants`, idêntico ao material de origem. Dúvida fechada — manter `/superadmin/...` no route file. Fonte: `backend/src/app.ts:91`.

Nota: as rotas superadmin são montadas ANTES do `tenantContextMiddleware` (app.ts:111), o que é coerente — superadmin opera fora de contexto de tenant. Hoje montadas sem auth (controller mock); a Fase 5 adiciona `requireAuth` + `requireSuperadmin`.

## 2026-06-03 13:42 — [MARCO] [refactor] Fase 1 — schema (migration + entities)

Escrito (sem rodar no banco ainda):
- `migrations/1747104000000-AddTenantStatusAndSoftDelete.ts`: em `tb_tenant` adiciona `tenant_status varchar(20) DEFAULT 'trial'` + CHECK `ck_tb_tenant_status` (active|trial|inactive|suspended) e `tenant_deleted_at timestamptz NULL`; faz UPDATE dos tenants existentes para `active`. Em `tb_user`: `tenant_id DROP NOT NULL` + índice único parcial `uq_tb_user_superadmin_email (user_email) WHERE tenant_id IS NULL`. `down()` reverte tudo (com `SET NOT NULL` que exige zero superadmins).
- `entities/Tenant.ts`: `status` (union type) + `deletedAt: Date | null`.
- `entities/User.ts`: `tenantId: string | null` (nullable) + docstring atualizada.

Impacto do nullable medido via typecheck: **zero quebra em produção** (call sites de `user.tenantId` ok). Único impacto: 3 fixtures de teste (`auth.e2e`, `auth.service`, `tenant-resolver.service`) que montavam `Tenant` literal — adicionado `status: 'active', deletedAt: null`. `npm run typecheck` (backend) verde após o ajuste.

Pendências antes de prosseguir: dev rodar `migration:run` localmente; resolver definição de `posts_count` (Fase 4).

## 2026-06-03 13:49 — [refactor] Fase 3 — middleware `requireSuperadmin`

Criado `middleware/require-superadmin.ts` espelhando `require-tenant-admin.ts`: aceita SOMENTE `req.user.role === 'superadmin'`, senão 403 `forbidden`. Sem herança de privilégio (tenant_admin/admin/editor → 403). Pressupõe `requireAuth` antes. Typecheck verde (`req.user` tem augmentation global de Request).

## 2026-06-03 17:58 — [MARCO] [refactor] Fase 7 — UI backoffice `/admin/tenants`

`backoffice/src/pages/tenants/TenantsPage.tsx` reescrito (era `React.createElement` + campos de cor + fetch sem auth). Agora: JSX/TS, self-contained com login próprio de superadmin (`POST /auth/superadmin/login`, `credentials: 'include'`), tabela (Nome/ID, Slug/Host, Status, Lojas, Posts, Criado, Ações), filtro de status, criação multi-step (1: nome→slug auto + host; 2: **flavor_slug** [default 'default'] + status; 3: admin email/senha), suspender/reativar, soft-delete com dupla confirmação. Erros do backend mapeados (validation_failed por campo, 409 slug/host). 401→volta pro login; 403→aviso.

Wiring: `backoffice/src/main.tsx` seleciona view por path (`/admin/tenants` → TenantsPage; resto → App tenant-scoped). Sem react-router (não instalado; App.tsx e AdminDashboard.tsx também são ad-hoc) — interim, trocar por roteamento real depois.

Lint React 19 `react-hooks/set-state-in-effect` reclamou do data-fetch no effect; resolvido com disable pontual (setState é pós-await, padrão legítimo; App.tsx usa o mesmo sem disable por nuance de config). Verificação: `npm run lint`/`typecheck`/`build` do backoffice todos verdes.

Backend + UI completos. Resta apenas o ciclo de conclusão (R.5.3 + R.7): atualizar features superadmin/auth/tenant-resolution, marcar critérios de aceite, arquivar — tudo no mesmo PR, com commits. Pendências operacionais do dev: rodar migration + `seed:superadmin`.

## 2026-06-03 17:17 — [refactor] Fase 8 — testes (validator, service, e2e auth)

3 arquivos novos, +30 testes (116 → 146 passando, 19 suites):
- `__tests__/tenant-validator.test.ts`: validações puras — payload válido sem cores, flavor_slug ok/inválido, nome/slug/email/senha/status, host local/IP (localhost/127.0.0.1/0.0.0.0/192.168.x) rejeitado.
- `__tests__/superadmin-tenant.service.test.ts`: fake `DataSource` + `invalidateTenantCache` mockado (jest.mock). Cobre create (happy path salva 2 entidades; SlugConflict/HostConflict no pré-check sem persistir), update (404, sucesso invalida cache host antigo+novo, HostConflict), softDelete (404, seta inactive/host mascarado/deletedAt + invalida cache).
- `__tests__/superadmin-tenant.e2e.test.ts`: supertest. Autorização — 401 sem cookie, 403 tenant_admin (GET+POST+PUT+DELETE), 200 superadmin (JWT forjado via `signAccessToken`, confirma requireAuth opção-a + requireSuperadmin). Login — `/auth/superadmin/login` 200+cookies (não capturado por `/auth/:slug/login`), 401 senha errada, 401 email inexistente, 400 sem campos.
- Stub de `AuthController` em `mock-deps.ts` ganhou `loginSuperadmin` (já feito na 5b).

Verificação: `npx jest` 146 passed/1 todo; lint 0 erros; typecheck verde.

Limitação consciente: os testes do service usam fake DataSource — NÃO exercitam rollback transacional real, a captura de unique-violation (23505) do Postgres, nem o SQL das agregações `countByTenant`. Isso só é coberto rodando contra DB real (a validação ponta-a-ponta fica para quando o dev rodar a migration + seed e exercitar via HTTP, ou uma futura suíte com DB).

## 2026-06-03 16:21 — [MARCO] [refactor] Fase 5b — login/seed de superadmin + isenção do TenantSubscriber

Fluxo de superadmin fechado ponta a ponta:
- `migration 1747104000000` estendida: `tb_refresh_token.tenant_id` também DROP NOT NULL (down re-seta). Sessão de superadmin é tenant-less.
- `entities/RefreshToken.ts`: `tenantId: string | null`.
- `subscribers/TenantSubscriber.ts`: distingue `tenantId === null` (insert global INTENCIONAL → permitido, p/ superadmin e seu refresh token) de `undefined` (omitido → fallback de contexto ou erro de acidente). Antes, ambos caíam no erro.
- `repositories/user.repository.ts`: `findSuperadminByEmail` (`role='superadmin'` + `tenantId IS NULL`, via `IsNull()`).
- `services/auth.service.ts`: `loginSuperadmin(email,password)` (JWT sem campos de tenant, refresh tenant-less); `refresh()` ganha branch para token com `tenantId===null`; `issueRefreshToken` aceita `tenantId: string | null`.
- `controllers/auth.controller.ts`: handler `loginSuperadmin` (body `{email,password}`, 400/401).
- `routes/auth.routes.ts`: `POST /auth/superadmin/login` registrado ANTES de `/auth/:slug/login` (senão "superadmin" vira slug). Bypassa resolução de host (já coberto por `startsWith('/auth/')`).
- `scripts/seed-superadmin.ts` + `package.json` `seed:superadmin` (env `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD`, idempotente).

Bug pego nos testes e corrigido: stub de `AuthController` em `mock-deps.ts` não tinha `loginSuperadmin` → `Route.post() requires a callback` em 4 testes (tenant-resolve/health que montam auth routes com stub). Adicionado ao stub.

Verificação: typecheck verde, lint 0 erros, `npx jest` **116 passed, 1 todo** (16 suites).

Estado: o superadmin agora loga de verdade (`POST /auth/superadmin/login`) e opera o CRUD. Falta só Fase 7 (UI) e Fase 8 (testes automatizados dos endpoints superadmin — ainda NÃO há cobertura específica deles).

## 2026-06-03 14:55 — [MARCO] [refactor] Fase 5 (CRUD) — controller real, validação, rotas, tolerância superadmin

Substituído o controller mock por `SuperadminTenantController` (classe, injeta `SuperadminTenantService`); mapeia erros nomeados → HTTP (400 validation_failed / 409 slug|host_already_taken / 404 tenant_not_found / 500). Trata tudo internamente (handlers async não chegam ao error middleware do Express — convenção do projeto).

`utils/tenantValidator.ts` reconciliado: removidos `primary_color`/`secondary_color`; adicionado `flavor_slug` opcional (regex slug). Demais validações (name 2-200, slug regex+2-100, host hostname+rejeita localhost/IPs, status enum, email, senha≥12) mantidas.

`routes/superadmin.routes.ts`: `createSuperadminRoutes(controller)` com `[requireAuth, requireSuperadmin]` em todas as rotas. Wiring em `app.ts` (AppDeps.superadminTenantController + passa pro factory) e `server.ts` (`new SuperadminTenantService(AppDataSource)` + controller). `__tests__/helpers/mock-deps.ts`: stub do controller.

**Tolerância de superadmin (opção a) implementada como pré-requisito** — sem isso o create estouraria no `TenantSubscriber`:
- `utils/jwt.ts`: `AccessTokenPayload.tenant*` agora opcionais.
- `middleware/require-auth.ts`: `AuthedUser.tenantId: string | null`; se `role==='superadmin'` (ou JWT sem tenantId), autentica e segue SEM `runWithTenantContext` (não abre contexto de tenant).

Verificação: `npm run typecheck` verde; `npm run lint` 0 erros (7 warnings pré-existentes, nenhum nos arquivos novos); `npx jest` **116 passed, 1 todo** (inclui 57 auth/tenant — requireAuth não regrediu).

Falta na área de auth (Fase 5b, separada): emitir JWT de superadmin no login (`auth.service`/`auth.controller`), semear um superadmin, e isentar `role=superadmin` no `TenantSubscriber.beforeInsert` (criar user sem tenant via save() ainda estoura "INSERT sem tenant_id"). Sem isso, os endpoints existem e estão protegidos, mas ninguém consegue logar como superadmin ainda.

## 2026-06-03 14:04 — [refactor] Fase 4 — `SuperadminTenantService`

Criado `services/superadmin-tenant.service.ts`. Decisão de arquitetura: o service recebe o `DataSource` direto (não os repos tenant-scoped) — justificado por (1) create transacional multi-tabela (tenant+admin) e (2) agregação cross-tabela na listagem. Registrado por divergir do padrão "service usa repository wrapper".

Métodos:
- `list({status,page,limit})`: query builder paginado + 2 agregações (`countByTenant` sobre `Store` e `News`) → sem N+1, 3 queries totais por página. `posts_count` = `News`.
- `createWithAdmin(input, actorUserId)`: pré-check de slug/host (409 amigável) + `dataSource.transaction` criando `Tenant` e `User(role=tenant_admin)` com `hashPassword`; captura unique violation (23505) por nome de constraint (`uq_tb_tenant_slug`/`uq_tb_tenant_host`) para fechar corrida. Log `tenant_created`.
- `update(id, patch, actor)`: 404 se inexistente; checa host duplicado (409); salva; invalida cache `tenant:resolve:{host}` (antigo + novo). Log `tenant_updated`.
- `softDelete(id, actor)`: status `inactive` + host `deleted-<id>.local` + `deletedAt=now`; invalida cache do host original. Log `tenant_soft_deleted`.

Erros nomeados exportados (`SlugConflictError`/`HostConflictError`/`TenantNotFoundError`) seguindo a convenção do `promotion.service` → controller (Fase 5) mapeia para 409/404. Respostas em snake_case conforme contrato SQU-72. Typecheck backend verde.

Gotcha descoberto (anotado p/ Fase 5): criar o **superadmin** (user com `tenantId=null`) via `manager.save(User)` vai DISPARAR o `TenantSubscriber` ("INSERT sem tenant_id ... nem TenantContext ativo"). O create de tenant+admin desta fase NÃO sofre (admin tem tenantId). Mas o seeding/criação de superadmin precisará contornar (ex.: subscriber isentar `role=superadmin`, ou insert via queryBuilder).

## 2026-06-03 14:05 — [MARCO] [decisão] Auth do superadmin = opção (a); `posts_count` = notícias

Usuário escolheu (a) (resposta "a", 2026-06-03 ~14:00): `requireAuth` passará a tolerar JWT sem tenant e NÃO abrirá `runWithTenantContext` quando `role=superadmin`. Implementação dessa tolerância fica na Fase 5 (wiring) + emissão de JWT de superadmin no `auth.service` (toca features `auth` e `tenant-resolution`).

`posts_count` = **contagem de `tb_news`** (recomendação aceita por não-objeção do usuário). Eventos/promoções/banners têm contadores próprios se necessário depois. Trivial de estender (método `countByTenant` por entidade).

## 2026-06-03 13:49 — [MARCO] [descoberta] `requireAuth` acopla auth + contexto de tenant

`requireAuth` (`middleware/require-auth.ts:48-61`) monta `TenantContext` a partir do JWT e roda `next()` dentro de `runWithTenantContext`. Isso pressupõe que TODO usuário autenticado tem tenant — falso para o superadmin (decisão 2: `tenant_id` null). Consequência: ou (a) `requireAuth` passa a tolerar payload sem tenant e NÃO abre contexto quando `role=superadmin`, ou (b) rotas superadmin usam um middleware de auth dedicado sem `runWithTenantContext`. Decisão adiada para a Fase 5 (wiring) + login de superadmin no `auth.service`. Registrado como dúvida em aberto. Fonte: `backend/src/middleware/require-auth.ts:48`.
