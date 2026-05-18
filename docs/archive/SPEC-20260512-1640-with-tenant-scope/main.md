# SPEC-20260512-1640: withTenantScope com validação UUID e docs operacionais

**Status:** done
**Criada:** 2026-05-12 16:40
**Ativada:** 2026-05-12 16:40
**Concluída:** 2026-05-12
**Commit final:** `4315bb7`
**Keywords:** tenant-resolution, withTenant, uuid, isolamento, docs
**Features:** tenant-resolution
**Branch:** feature/SQU-33-helper-withtenant
**Depende de:** SPEC-20260503-1505
**Origem:** usuário em 2026-05-12 16:40
**Resumo:** Formaliza a entrega do helper `withTenantScope(tenantId)` para isolamento explícito fora de request, com validação de UUID v4, cobertura de testes e documentação de uso obrigatório no backend.

## Objetivo

Evitar vazamento cross-tenant quando o código roda fora do fluxo HTTP com `AsyncLocalStorage` (scripts/jobs/processos internos). A entrega complementa o `withTenant(qb)` existente com um escopo explícito por `tenantId`, mantendo fail-fast para IDs inválidos e tabelas sem coluna de tenant.

## Escopo

**DENTRO:**
- Implementar `withTenantScope(tenantId)` em `backend/src/utils/with-tenant.ts`
- Validar `tenantId` vazio e formato UUID v4
- Expor métodos `select`, `insertValues`, `update`, `delete`, `findOne`
- Cobrir cenários principais em teste unitário
- Documentar regra obrigatória de uso em README do backend

**FORA:**
- Migrar stack para Drizzle
- Adicionar regra ESLint custom automática para bloquear import direto de DB
- Alterar middleware de tenant context já existente

## Implementação

O helper `withTenant(qb)` foi mantido para requests HTTP (tenant vindo do `AsyncLocalStorage`) e foi adicionada a API `withTenantScope(tenantId)` para uso explícito fora desse contexto.

`withTenantScope`:
- rejeita `tenantId` vazio
- rejeita `tenantId` fora do regex UUID v4
- aplica `andWhere(<alias>.tenant_id = :__tenantId)` em `select`, `update`, `delete`
- injeta `tenantId` em payload de insert via `insertValues`
- faz `findOne` com `tenantId` acoplado ao filtro
- falha de forma clara quando metadata indicar tabela sem `tenant_id`

Arquivos alterados:
- `backend/src/utils/with-tenant.ts`
- `backend/__tests__/with-tenant-scope.test.ts`
- `backend/README.md`

Validação executada:
- `npm run typecheck -w backend`
- `npm test -- --runTestsByPath __tests__/with-tenant-scope.test.ts __tests__/cross-tenant-isolation.test.ts -w backend`
- `npm test -- --runInBand -w backend`

## Critério de aceite

- [x] Pasta da SPEC criada em `docs/active/SPEC-20260512-1640-with-tenant-scope/` com `main.md`, `state.md`, `memory.md` (2026-05-12 16:40)
- [x] `withTenantScope` implementado com validação de UUID v4 e erros claros (2026-05-12 16:40, commit `ec5596b`)
- [x] Testes unitários cobrindo erros e aplicação de escopo por tenant (2026-05-12 16:40, commit `ec5596b`)
- [x] README do backend com regra de uso obrigatório do helper (2026-05-12 16:49, commit `4315bb7`)
- [x] Features tocadas (`tenant-resolution`) atualizadas com referência a esta SPEC (2026-05-18 — arquivamento R.7)
- [x] `state.md` com entrada `[conclusão]` (2026-05-18 — arquivamento R.7)
- [x] `memory.md` com TL;DR final atualizado (2026-05-18 — arquivamento R.7)

