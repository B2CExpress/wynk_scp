# SPEC-20260506-2214: Autenticacao JWT do painel admin (SQU-37)

**Status:** active
**Criada:** 2026-05-06 22:14
**Ativada:** 2026-05-06 22:14
**Concluida:** —
**Commit final:** —
**Keywords:** auth, jwt, admin-users, cookies-httponly, bcrypt, refresh-token, rate-limit
**Features:** auth, admin-users
**Branch:** feature/SQU-37-autenticacao-jwt
**Depende de:** SPEC-20260503-1505 (base da plataforma — fornece tabela `tenants`, helper `db/withTenant`, Redis)
**Origem:** ticket SQU-37 (usuario em 2026-05-06 22:14) — recorte do §10 da SPEC-20260503-1505

**Resumo:** Entrega autenticacao do painel administrativo (backoffice) com JWT em cookies HttpOnly: tabela `admin_users`, 4 endpoints (login/logout/refresh/me), helpers de bcrypt e JWT, helper de sessao server-side, rate limit no login e seed de admins de teste por tenant + 1 superadmin global.

## Objetivo

Permitir que editores, tenant admins e superadmins facam login no painel com seguranca padrao da industria: senha em bcrypt, access token curto (15 min) + refresh token longo (7 dias), ambos em cookies HttpOnly + Secure (em prod) + SameSite=Lax. Sem token em localStorage. Sem mensagem que vaze existencia de email.

## Escopo

**DENTRO:**
- Tabela `admin_users` (id, tenant_id nullable, email unique, password_hash bcrypt, role, name, is_active, last_login_at, created_at, updated_at) + indices (PK id, UNIQUE email, INDEX tenant_id).
- Migration aplicavel via toolchain do `backend/`.
- `lib/auth/password.ts` — `hashPassword(plain)` + `verifyPassword(plain, hash)` com bcrypt cost 10.
- `lib/auth/jwt.ts` — `signAccessToken(payload)` (15 min, payload `{sub, role, tenant_id}`), `signRefreshToken(payload)` (7 dias, payload `{sub, type:'refresh'}`), `verifyToken(token, type)` usando `jose`.
- `lib/auth/session.ts` — `getServerSession()` que le cookie `access`, valida JWT, retorna user ou null.
- `app/api/auth/login/route.ts` (POST) — Zod-valida body, busca user GLOBAL por email (sem escopo de tenant), checa is_active (403 se inativo), bcrypt.compare, valida cross-tenant via header `x-tenant-id` quando user tem tenant_id, gera 2 cookies, atualiza `last_login_at`. Mensagem generica em 401.
- `app/api/auth/logout/route.ts` (POST) — apaga ambos cookies via Max-Age=0.
- `app/api/auth/refresh/route.ts` (POST) — le cookie refresh, valida, gera novo access cookie.
- `app/api/auth/me/route.ts` (GET) — usa `getServerSession()`, 200 com user ou 401.
- Configuracao de cookies: `httpOnly:true`, `secure: NODE_ENV==='production'`, `sameSite:'lax'`, `path:'/'`, `domain: undefined`, `maxAge: 900` (access) / `604800` (refresh).
- Rate limit `/login`: 5 tentativas/min por IP via Redis (token bucket).
- `JWT_SECRET` em `.env` (gerado com `openssl rand -base64 32`); `.env.example` atualizado; nunca commitado.
- Seed em `scripts/seed-tenants.ts`: 1 admin por tenant (`admin@tenant<N>.local` / `admin123`) + 1 superadmin sem `tenant_id` (`superadmin@plataforma.com` / `super123`), senhas hasheadas com bcrypt antes do INSERT.

**FORA:**
- UI de login no `backoffice/` (consumida por SPEC posterior — esta SPEC entrega apenas o backend de auth).
- Recuperacao de senha / reset por email.
- 2FA / MFA.
- Auditoria de login além de `last_login_at` (logs estruturados ficam pra SPEC de observabilidade).
- Sessao no `portal/` (publico, nao tem login admin).
- CRUD de admin users no painel (entregue na SPEC-20260503-1509 §7.1 quando ativada).
- Impersonacao por superadmin (SPEC-20260503-1509).

## Implementacao

**Stack assumida** (a confirmar na 1a sessao de codigo): Next.js (App Router) + TypeScript no `backend/` (alinhado a SPEC-20260503-1505 §6.2 que preve `headers()` do Next), `jose` para JWT, `bcrypt` para hash, Drizzle ORM (inferido pelo path `lib/db/schema.ts` no ticket).

**Arquivos suger
idos:**
- `backend/lib/db/schema.ts` — adicionar `admin_users`
- `backend/lib/auth/jwt.ts` — sign/verify com `jose`
- `backend/lib/auth/password.ts` — bcrypt cost 10
- `backend/lib/auth/session.ts` — `getServerSession()`
- `backend/lib/auth/rate-limit.ts` — token bucket Redis (key `ratelimit:login:{ip}`)
- `backend/app/api/auth/login/route.ts`
- `backend/app/api/auth/logout/route.ts`
- `backend/app/api/auth/refresh/route.ts`
- `backend/app/api/auth/me/route.ts`
- `backend/scripts/seed-tenants.ts` — estender com admins

**Decisoes tecnicas:**
- **Login global por email** (nao escopa por tenant_id na busca): email e UNIQUE no banco; cross-tenant e prevenido em 2 camadas — (1) header `x-tenant-id` deve bater com `user.tenant_id` quando o user tem tenant_id, (2) cookies tem `domain: undefined`, ou seja, ficam vinculados ao host onde foram setados, isolando dominios `tenant1.local` / `tenant2.local` automaticamente.
- **Mensagem generica em 401** (`"email ou senha incorretos"`) tanto pra "email nao existe" quanto "senha errada" — evita enumeracao de usuarios.
- **`is_active=false` retorna 403** (nao 401) — sinal claro pro cliente distinguir credencial invalida de conta bloqueada, sem vazar info adicional (ja autenticou com sucesso a senha antes desse check).
- **bcrypt cost 10** — padrao OWASP 2025; ajustavel se hardware exigir.
- **Access token payload mantem `tenant_id` e `role`** — middleware downstream usa direto sem hit no banco.
- **Refresh token tem `type:'refresh'`** distinto do access (`type` ausente ou `'access'`); `verifyToken(token, type)` rejeita troca cruzada (refresh nao serve como access e vice-versa).
- **Rate limit com Redis** alinhado a SPEC-1505 §9 (Redis ja na stack); chave `ratelimit:login:{ip}`, janela 60s, 5 tentativas. Em DEV sem Redis, fallback in-memory (dev-only) — registrar em state se aplicado.
- **Seed idempotente** — checar email antes de inserir (ON CONFLICT DO NOTHING).

**Gotchas conhecidos:**
- `secure:true` em dev sem HTTPS faz cookie nao chegar ao servidor — `secure` so em prod (`NODE_ENV==='production'`).
- bcrypt e CPU-bound — em testes de carga, pool de threads do Node pode saturar; medir antes de subir cost.
- `jose` aceita JWK e raw secret — usar `new TextEncoder().encode(JWT_SECRET)` pra HS256.
- `last_login_at` UPDATE precisa rodar mesmo com clock skew — usar `now()` do banco, nao do app.
- Cookie cross-tenant: como `domain: undefined`, navegador ja nao envia cookie de `tenant1.local` pra `tenant2.local`. Mas em testes locais via curl reusando `cookies.txt` entre dominios, a expectativa e 401 — confirmar no teste manual #5 do ticket.

## Criterio de aceite

- [ ] Tabela `admin_users` criada com schema da spec + indices (PK id, UNIQUE email, INDEX tenant_id)
- [ ] Migration aplicada e reversivel (down funciona)
- [ ] `lib/auth/password.ts` com `hashPassword`/`verifyPassword` (bcrypt cost 10)
- [ ] `lib/auth/jwt.ts` com sign/verify access (15 min) e refresh (7 dias) usando `jose`
- [ ] `lib/auth/session.ts:getServerSession()` retorna user ou null lendo cookie `access`
- [ ] `JWT_SECRET` em `.env`/`.env.example`; valor real nao commitado; gerado com `openssl rand -base64 32`
- [ ] POST `/api/auth/login` com credenciais corretas → 200 + 2 cookies HttpOnly (access + refresh) e atualiza `last_login_at`
- [ ] POST `/api/auth/login` com senha errada → 401 com mensagem generica (nao revela existencia do email)
- [ ] POST `/api/auth/login` com `is_active=false` → 403
- [ ] POST `/api/auth/login` com email existindo em outro tenant (`x-tenant-id` divergente) → 401
- [ ] POST `/api/auth/login` rate-limited → 429 apos 5 tentativas/min do mesmo IP
- [ ] POST `/api/auth/refresh` com refresh valido → 200 + novo access cookie
- [ ] POST `/api/auth/refresh` sem cookie ou expirado → 401
- [ ] POST `/api/auth/logout` → 200 + ambos cookies removidos (Max-Age=0)
- [ ] GET `/api/auth/me` com cookie valido → 200 com `{id, email, name, role, tenant_id}`
- [ ] GET `/api/auth/me` sem cookie ou expirado → 401
- [ ] Cookies marcados `HttpOnly`; `Secure` apenas em producao; `SameSite=Lax`; `path=/`; `domain` ausente
- [ ] Cross-tenant: cookie de `tenant1.local` nao autentica em `tenant2.local`
- [ ] Seed cria 1 admin por tenant existente + 1 superadmin global; senhas em bcrypt; idempotente
- [ ] Senha NUNCA em texto puro nos logs/respostas; `password_hash` nunca volta no JSON do `/me` ou `/login`
- [ ] Os 5 testes manuais do ticket (curl) passam conforme esperado
- [ ] **Features tocadas (auth, admin-users) atualizadas** com timestamp e referencia a esta SPEC
- [ ] `state.md` com entrada `[conclusao]`
- [ ] `memory.md` com TL;DR final atualizado
