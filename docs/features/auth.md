# Feature: auth

**Keywords:** jwt, refresh-token, cookies, httponly, secure, autenticação, bcrypt, refresh-rotation, reuse-detection
**Arquivos principais:**
  - `backend/src/entities/User.ts` (`tb_user`, UNIQUE `(tenant_id, user_email)`)
  - `backend/src/entities/RefreshToken.ts` (`tb_refresh_token`, hash SHA-256, FK pra user)
  - `backend/src/repositories/user.repository.ts` (`findByTenantAndEmail`, `findById`, `save`)
  - `backend/src/repositories/refresh-token.repository.ts` (`findValidByHash`, `findAnyByHash`, `save`, `revoke`, `revokeAllForUser`)
  - `backend/src/services/auth.service.ts` (`login`/`refresh`/`logout` + erros tipados)
  - `backend/src/controllers/auth.controller.ts` (login, refresh, logout, me; cookies HttpOnly+Secure+SameSite=Lax)
  - `backend/src/routes/auth.routes.ts` (4 endpoints: `POST /auth/:slug/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`)
  - `backend/src/middleware/require-auth.ts` (valida access cookie, popula `req.user` + `req.tenant`, encadeia `next()` em `runWithTenantContext`)
  - `backend/src/utils/jwt.ts` (`signAccessToken`/`verifyAccessToken`, payload tipado)
  - `backend/src/utils/passwords.ts` (bcrypt + `generateRefreshToken` random hex + `hashRefreshToken` SHA-256)
  - `backend/src/migrations/1746748200000-CreateUserTable.ts`
  - `backend/src/migrations/1746748300000-CreateRefreshTokenTable.ts`
  - `backend/src/types/express.d.ts` (`req.user`, `req.tenant`)
  - `backend/scripts/seed.ts` (cria admin `admin@<tenant_host>` com senha vinda de `SEED_ADMIN_PASSWORD`)
  - `backend/__tests__/auth.service.test.ts` (9 cases unit)
  - `backend/__tests__/auth.e2e.test.ts` (13 cases supertest, incl. reuse detection)
**Resumo:** Autenticação por JWT (15 min) + refresh token rotativo (7 dias) em cookies HttpOnly+Secure+SameSite=Lax. Login por slug do tenant na URL (`POST /auth/:slug/login`), email único por `(tenant_id, email)`. Refresh hashado em DB (SHA-256), rotação a cada uso, detecção de reuso revoga toda a cadeia do user. Sem superadmin global.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260503-1505 | 2026-05-11 | `968d389` | Base da plataforma multitenant |
| SPEC-20260514-2012 | 2026-05-18 | `b38052c` | Isolamento multitenant de stores com testes reais |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

### Schema

- `scp.tb_user(user_id uuid PK, tenant_id uuid FK NOT NULL, user_email, user_password_hash, user_name, user_role default 'tenant_admin', user_created_at, user_updated_at)`. UNIQUE `(tenant_id, user_email)` — mesmo email pode existir em tenants diferentes (1 operador trabalhando em 2 shoppings = 2 contas).
- `scp.tb_refresh_token(token_id uuid PK, user_id uuid FK, tenant_id uuid FK, token_hash unique, token_expires_at, token_revoked_at nullable, token_created_at)`. Index `ix_tb_refresh_token_user_id` pra `revokeAllForUser` (reuse detection).

### Endpoints

- `POST /auth/:slug/login` body `{email, password}` → 200 `{user:{id,email,name,role}}` + cookies `scp_access` (path=/, maxAge 15 min) e `scp_refresh` (path=/auth, maxAge 7d). Slug do tenant vem da URL — `/auth/*` bypassa `resolveTenantByHost`. Falha → 401 `invalid_credentials` (mesma resposta pra tenant inexistente, email inexistente e senha errada — não vaza enumeração).
- `POST /auth/refresh` (cookie `scp_refresh`) → 204 + novos cookies. Token usado é revogado; emite novo. Reapresentar refresh **já revogado**: revoga toda a cadeia do user (`revokeAllForUser`) e responde 401.
- `POST /auth/logout` (cookie `scp_refresh`) → 204, revoga refresh.
- `GET /auth/me` (cookie `scp_access`) → 200 `{user:{id,email,name,role,tenantId}}`. Protegido por `requireAuth`.

### JWT payload

```ts
{
  sub: userId,
  tenantId, tenantSlug, tenantFlavorSlug,  // tenant context completo
  role,                                     // operacional
  iat, exp                                  // padrão
}
```

`requireAuth` valida + popula `req.user` e `req.tenant` a partir do JWT (sem consultar DB). Mudança de slug/flavor no DB exige re-login (TTL 15 min do access).

### Refresh token

- 32 bytes random (256 bits entropy) em hex (64 chars).
- DB armazena **SHA-256 hex** do plain (não bcrypt) — espaço de busca já é massivo, slow hash não agrega; DB comprometido não vaza sessões ativas (pré-imagem).
- Rotação em cada `/auth/refresh`. Reuse detection: tabela tem `findAnyByHash` (sem filtro de `revoked_at`); se um refresh já revogado for reapresentado, dispara `revokeAllForUser(userId)`.

### Cookies

```
scp_access:  path=/,      maxAge=15min, HttpOnly, SameSite=Lax, Secure (em prod)
scp_refresh: path=/auth,  maxAge=7d,    HttpOnly, SameSite=Lax, Secure (em prod)
```

`scp_refresh` só viaja em `/auth/*` (refresh + logout). `clearCookie()` usa options **sem `maxAge`** (Express deprecou maxAge no clear) — `accessCookieOptions/refreshCookieOptions` são as bases; `setAccessCookie/setRefreshCookie` adicionam maxAge só no set.

### Seed

`backend/scripts/seed.ts` lê `seeds/tenants.json` (fonte canônica) e cria 1 admin por tenant: email `admin@<tenant_host>`, senha bcrypt vinda de `SEED_ADMIN_PASSWORD` (fallback `admin123` em dev com warn; **obrigatória em production**). Idempotente — re-run preserva senha existente.

> Última atualização: 2026-05-11 09:00 (SPEC-20260503-1505)

## Decisões arquiteturais ativas

- **Sem superadmin global nesta SPEC** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — `tb_user.tenant_id NOT NULL`, FK pra `tb_tenant`. Cada user pertence a exatamente 1 tenant. Pode ser revisitado se requisito de operação global aparecer.
- **Login por URL slug, não por host** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — `POST /auth/:slug/login`. Backoffice planejado em domínio único (`admin.scp.local/<slug>/login`); slug embutido na URL. `/auth/*` bypassa `resolveTenantByHost`. Trade-off: tenant pode ser identificado pela URL pública — aceito, é o slug operacional, não secreto.
- **Email único por tenant, não global** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — UNIQUE `(tenant_id, email)`. Mesmo email em N tenants → N contas. Resolve caso "operador em 2 shoppings".
- **Refresh rotativo com reuse detection (revoga toda a cadeia)** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — Reapresentar refresh já revogado é assumido como leak: revoga **todos os tokens vivos do user**, não só o atual. Trade-off: false positive (cliente buggy reusando token) desloga o user — aceito como custo da segurança.
- **Refresh hashado em DB como SHA-256, não bcrypt** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — Plain text tem 256 bits de entropia; slow hash não agrega contra brute-force. SHA-256 é suficiente pra proteção de pré-imagem em DB comprometido.
- **Erros `InvalidCredentialsError` e `TenantNotFoundError` retornam mesma resposta no controller** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — `401 invalid_credentials`. Evita enumeração de tenants/emails via timing ou conteúdo.
- **JWT carrega tenant context completo** (origem: SPEC-20260503-1505, 2026-05-09 19:45) — Sem nova consulta ao DB em cada request; `requireAuth` popula `req.user` + `req.tenant` direto do payload.

## Alternativas consideradas e rejeitadas

- **Login por host do tenant** (2026-05-09 19:45) — `POST /auth/login` no host do shopping. Rejeitada porque backoffice é um único domínio (`admin.scp.local`), slug precisa estar na URL pra identificar o tenant.
- **Refresh hashado com bcrypt** (2026-05-09 19:45) — Overhead computacional desnecessário; entropia já é suficiente.
- **Sessão server-side (`tb_session`)** (2026-05-09 19:45) — Vira "JWT inflado". Refresh-rotation com SHA-256 cobre o ataque-modelo e é mais leve no hot path.
- **Sem reuse detection (só revoga o token reapresentado)** (2026-05-09 19:45) — Subóptimo; se atacante usou refresh roubado uma vez, ele já se rotaciona. Revogar a cadeia inteira força o user legítimo a re-logar e invalida o atacante.

## Gotchas

- **Express deprecou `maxAge` em `clearCookie()`** (2026-05-09 19:45) — Setar maxAge no clear gera warn. Fix: separar `accessCookieOptions`/`refreshCookieOptions` (sem maxAge, usadas em set+clear) de helpers que adicionam maxAge só no set.
- **`bypassFor` não suportava prefixos** (2026-05-09 19:45) — Auth precisa de `/auth/*` (não match exato). Fix: virou predicate-based.
- **Stub `AuthController` em testes que não exercitam auth** (2026-05-09 19:45) — Após adicionar `authController` ao `AppDeps`, testes antigos quebravam por falta de instância. Fix: `makeStubAuthController()` em `__tests__/helpers/mock-deps.ts` retorna 501 em todas as rotas.
- **`SEED_ADMIN_PASSWORD` exige `.env` no `backend/`** (2026-05-11 08:50) — Sem o `.env` o `dotenv` não carrega `DB_PORT=5435` e seed bate em 5432 (default). Idem pra `SEED_ADMIN_PASSWORD` — sem env, dev tem fallback `admin123` com warn; prod lança.

## Estado congelado (se houver)

_(nenhum)_
