# SPEC-20260512-1601: Hardening do cache Redis de tenant

**Status:** done
**Criada:** 2026-05-12 16:01
**Ativada:** 2026-05-12 16:01
**Concluída:** 2026-05-12
**Commit final:** `99a29d1`
**Keywords:** tenant-resolution, redis, cache, ttl, fallback, docker
**Features:** tenant-resolution, infra-base
**Branch:** feature/SQU-35-redis-cache
**Depende de:** SPEC-20260503-1505
**Origem:** usuário em 2026-05-12 16:01
**Resumo:** Documentar e consolidar o hardening do cache Redis da resolução de tenant, incluindo fallback seguro para Postgres, TTL configurável via env, logs estruturados e ajuste da infra local para usar `REDIS_URL`.

## Objetivo

Registrar formalmente a mudança já implementada no backend para que a resolução de tenant continue rápida quando o Redis está saudável e continue funcional quando o Redis cai. A SPEC também precisa alinhar a documentação viva das features `tenant-resolution` e `infra-base` com o estado real do código e da infra local.

## Escopo

**DENTRO:**
- Documentar a mudança em `backend/src/services/tenant-resolver.service.ts` para cache best-effort com fallback para Postgres
- Documentar `REDIS_URL` e `CACHE_TTL_TENANT_SECONDS` como variáveis de ambiente suportadas pelo backend
- Documentar `invalidateTenantCache(host)` e os logs estruturados de `HIT`, `MISS`, `write`, `invalidate` e erro
- Atualizar `docs/features/tenant-resolution.md` com o novo comportamento do cache
- Atualizar `docs/features/infra-base.md` com a configuração atual de Redis e `docker-compose.yml`
- Registrar a validação executada: `npm run typecheck`, suite do resolver e suite completa do backend

**FORA:**
- Criar endpoint HTTP de invalidação de cache para admin
- Alterar o modelo de branding do tenant (continua em `portal/public/flavors/`)
- Implementar cache de `null` para host inexistente
- Subir Docker ou executar smoke real em containers neste host sem binário `docker`

## Implementação

O backend continua resolvendo tenant via `TenantResolverService`, mas agora o acesso ao Redis é explicitamente tratado como otimização e não como dependência funcional. `resolveByHost(host)` tenta `GET tenant:resolve:{host}`; se houver payload válido, retorna `TenantContext` tipado e loga `tenant cache HIT`. Se o `GET` falhar, loga warning e cai para `TenantRepository.findByHost(host)` sem quebrar a request. Cache miss também é logado (`tenant cache MISS`).

Quando um tenant é encontrado no Postgres, o service tenta persistir o payload serializado com TTL vindo de `config.cache.tenantTtlSeconds` (`CACHE_TTL_TENANT_SECONDS`, default 600). Falha de `SET` não derruba a request; apenas gera warning. `null` não é cacheado, evitando stale 404 após cadastro de tenant novo. O parse do payload do Redis valida o shape antes de retornar, evitando `any` silencioso.

Na infra, `backend/src/config/index.ts` agora aceita `REDIS_URL` como fonte principal e mantém fallback compatível para `REDIS_HOST`/`REDIS_PORT`. `backend/src/config/redis.ts` passou a instanciar `ioredis` pela URL e registrar falhas de conexão no logger estruturado do projeto. `docker-compose.yml` foi alinhado para expor Redis em `6379` por default, e `backend/.env.example` passou a documentar `REDIS_URL` e `CACHE_TTL_TENANT_SECONDS`.

Documentação viva tocada por esta SPEC:
- `docs/features/tenant-resolution.md`
- `docs/features/infra-base.md`

Validação executada nesta sessão:
- `npm ci` na raiz para instalar os workspaces
- `npm test -- --runTestsByPath __tests__/tenant-resolver.service.test.ts` em `backend/`
- `npm run typecheck` em `backend/`
- `npm test -- --runInBand` em `backend/`

Limitação conhecida nesta sessão: o host atual não possui `docker` no PATH, então o smoke real de `docker compose up -d postgres redis` não pôde ser executado aqui.

## Critério de aceite

- [x] SPEC criada em `docs/active/` com `main.md`, `state.md` e `memory.md` (2026-05-12 16:01)
- [x] Mudança de cache best-effort, `REDIS_URL`, TTL configurável e invalidação helper documentadas nesta SPEC (2026-05-12 16:01)
- [x] Validação executada (`typecheck`, teste do resolver e suite completa do backend) registrada no `state.md` (2026-05-12 16:01)
- [x] **Features tocadas (tenant-resolution, infra-base) atualizadas** com timestamp e referência a esta SPEC (2026-05-18 — arquivamento R.7)
- [x] `state.md` com entrada `[conclusão]` (2026-05-18 — arquivamento R.7)
- [x] `memory.md` com TL;DR final atualizado (2026-05-18 — arquivamento R.7)
