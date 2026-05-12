# SPEC-20260512-1640: withTenantScope com validacao UUID e docs operacionais

**Status:** active
**Criada:** 2026-05-12 16:40
**Ativada:** 2026-05-12 16:40
**Concluida:** —
**Commit final:** —
**Keywords:** tenant-resolution, withTenant, uuid, isolamento, docs
**Features:** tenant-resolution
**Branch:** feature/SQU-33-helper-withtenant
**Depende de:** SPEC-20260503-1505
**Origem:** usuario em 2026-05-12 16:40
**Resumo:** Formaliza a entrega do helper `withTenantScope(tenantId)` para isolamento explicito fora de request, com validacao de UUID v4, cobertura de testes e documentacao de uso obrigatorio no backend.

## Objetivo

Evitar vazamento cross-tenant quando o codigo roda fora do fluxo HTTP com `AsyncLocalStorage` (scripts/jobs/processos internos). A entrega complementa o `withTenant(qb)` existente com um escopo explicito por `tenantId`, mantendo fail-fast para IDs invalidos e tabelas sem coluna de tenant.

## Escopo

**DENTRO:**
- Implementar `withTenantScope(tenantId)` em `backend/src/utils/with-tenant.ts`
- Validar `tenantId` vazio e formato UUID v4
- Expor metodos `select`, `insertValues`, `update`, `delete`, `findOne`
- Cobrir cenarios principais em teste unitario
- Documentar regra obrigatoria de uso em README do backend

**FORA:**
- Migrar stack para Drizzle
- Adicionar regra ESLint custom automatica para bloquear import direto de DB
- Alterar middleware de tenant context ja existente

## Implementacao

O helper `withTenant(qb)` foi mantido para requests HTTP (tenant vindo do `AsyncLocalStorage`) e foi adicionada a API `withTenantScope(tenantId)` para uso explicito fora desse contexto.

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

Validacao executada:
- `npm run typecheck -w backend`
- `npm test -- --runTestsByPath __tests__/with-tenant-scope.test.ts __tests__/cross-tenant-isolation.test.ts -w backend`
- `npm test -- --runInBand -w backend`

## Criterio de aceite

- [ ] Pasta da SPEC criada em `docs/active/SPEC-20260512-1640-with-tenant-scope/` com `main.md`, `state.md`, `memory.md`
- [ ] `withTenantScope` implementado com validacao de UUID v4 e erros claros
- [ ] Testes unitarios cobrindo erros e aplicacao de escopo por tenant
- [ ] README do backend com regra de uso obrigatorio do helper
- [ ] Feature tocada (`tenant-resolution`) atualizada com referencia a esta SPEC
- [ ] `state.md` com entrada `[conclusao]`
- [ ] `memory.md` com TL;DR final atualizado

