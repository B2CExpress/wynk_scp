# State — SPEC-20260512-1601

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-12 16:01

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-12 16:01
**Onde tô:** SPEC de documentação criada; código e features já alinhados com o hardening do cache de tenant.
**Próximo passo:** revisar `main.md` com o dev e decidir se a SPEC será arquivada após commit/smoke externo de Docker.
**Última decisão:** manter a SPEC em `active` porque a mudança está validada por testes, mas ainda sem commit final e sem smoke em Docker neste host.
**Bloqueio atual:** `docker` indisponível no host atual.
**Se retomar, ler:** entradas desta sessão inteira; foco em `[tentativa] Validação e smoke local`.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Levantar o que mudou no código e na infra do cache de tenant | concluído | 2026-05-12 16:01 | — |
| 2 | Criar SPEC ativa documentando a mudança implementada | concluído | 2026-05-12 16:01 | — |
| 3 | Atualizar features `tenant-resolution` e `infra-base` | concluído | 2026-05-12 16:01 | — |
| 4 | Registrar validação executada e limitação do ambiente local | concluído | 2026-05-12 16:01 | — |
| 5 | Arquivar a SPEC após commit final e smoke externo de Docker | em progresso | 2026-05-12 16:01 | — |

### Próximos passos

- [ ] Revisar o `main.md` desta SPEC com o dev humano
- [ ] Fazer commit das mudanças de código e docs
- [ ] Rodar `docker compose up -d postgres redis` em ambiente com Docker disponível
- [ ] Arquivar a SPEC e mover a linha de `Em execução` para `Concluídas` nas features

### Bloqueios ativos

- `docker` não está disponível no PATH deste host; smoke de containers ficou pendente.

---

## Fatos confirmados

- [2026-05-12 16:01] `backend/src/services/tenant-resolver.service.ts` agora trata falhas de `GET`, `SET` e `DEL` do Redis como best-effort e exporta `invalidateTenantCache(host)`. Fonte: `backend/src/services/tenant-resolver.service.ts`.
- [2026-05-12 16:01] `backend/src/config/index.ts` aceita `REDIS_URL` e `CACHE_TTL_TENANT_SECONDS`; `backend/src/config/redis.ts` instancia `ioredis` pela URL. Fonte: `backend/src/config/index.ts`, `backend/src/config/redis.ts`.
- [2026-05-12 16:01] `backend/.env.example` passou a documentar `REDIS_URL=redis://localhost:6379` e `CACHE_TTL_TENANT_SECONDS=600`. Fonte: `backend/.env.example`.
- [2026-05-12 16:01] `docker-compose.yml` expõe Redis em `6379:6379` por default. Fonte: `docker-compose.yml`.
- [2026-05-12 16:01] `npm run typecheck` em `backend/` passou. Fonte: comando `npm run typecheck`.
- [2026-05-12 16:01] `npm test -- --runTestsByPath __tests__/tenant-resolver.service.test.ts` passou com 9 testes verdes. Fonte: comando `npm test -- --runTestsByPath __tests__/tenant-resolver.service.test.ts`.
- [2026-05-12 16:01] `npm test -- --runInBand` em `backend/` passou com 10 suites e 74 testes verdes. Fonte: comando `npm test -- --runInBand`.
- [2026-05-12 16:01] `docker compose up -d postgres redis` não pôde ser executado porque `docker` não é reconhecido no host. Fonte: comando `docker compose up -d postgres redis`.

## Inferências prováveis

- [2026-05-12 16:01] Após commit e smoke com Docker em outro host, esta SPEC poderá ser arquivada sem mudança técnica adicional. Validar com: commit + smoke real em ambiente com Docker.

## Dúvidas em aberto

- [2026-05-12 16:01] O time quer manter `6379` como porta padrão definitiva ou voltar para uma porta não conflitiva em ambientes com outro Redis local? Próxima ação: confirmar na revisão humana do `main.md`.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-12 16:01 — [ativação]

SPEC criada retroativamente para documentar a mudança já implementada no hardening do cache Redis da resolução de tenant. Escopo cobre o service, a configuração de env/Redis, a infra local e as feature docs `tenant-resolution` e `infra-base`.

## 2026-05-12 16:01 — [MARCO] [decisão] Manter a SPEC em active até existir commit final

A mudança de código já foi implementada e validada localmente por testes, mas ainda não existe commit final associado nem smoke em Docker neste host. Por isso a documentação nasce como `active`, e não vai direto para `archive`.
Commit: —

## 2026-05-12 16:01 — [descoberta] Escopo técnico consolidado

O hardening entregue inclui `REDIS_URL`, TTL configurável via `CACHE_TTL_TENANT_SECONDS`, logs estruturados de hit/miss/falha, parse tipado do payload e `invalidateTenantCache(host)` exportado no mesmo módulo do resolver.
Fonte: `backend/src/services/tenant-resolver.service.ts`, `backend/src/config/index.ts`, `backend/src/config/redis.ts`

## 2026-05-12 16:01 — [tentativa] Validação e smoke local

Instalei as dependências com `npm ci`, rodei o teste focado do resolver, `typecheck` e a suite completa do backend — todos passaram. Tentei subir `docker compose up -d postgres redis`, mas o host não possui `docker` no PATH.
Commit: —

## 2026-05-12 16:01 — [nota] Features vivas atualizadas

`docs/features/tenant-resolution.md` e `docs/features/infra-base.md` foram atualizadas para incluir a linha desta SPEC em `Em execução` e refletir o novo estado real do cache/configuração de Redis.
