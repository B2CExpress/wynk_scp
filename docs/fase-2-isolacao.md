# Fase 2 - Validacao de isolamento multitenant de stores

## Status

- Suite implementada em `tests/isolation/stores.test.ts`
- Infra Vitest criada na raiz (`vitest.config.ts`, `tests/helpers/`)
- Backend expandido com a superficie minima para os cenarios obrigatorios:
  - `GET /api/v1/stores/:slug`
  - `POST /api/admin/stores`
  - `PUT /api/admin/stores/:id`
- CI atualizada para rodar `npm run test:isolation` com Postgres e Redis de servico

## Cenarios cobertos

1. `GET /api/v1/stores` em `tenant1.local` nao retorna lojas de `tenant2`
2. `GET /api/v1/stores/:slug` de slug existente apenas em `tenant2` retorna `404` quando chamado em `tenant1`
3. `POST /api/admin/stores` ignora `tenant_id` enviado no payload e usa o tenant da sessao
4. O mesmo `slug` pode existir em tenants diferentes
5. `DELETE FROM scp.tb_tenant WHERE tenant_id = ...` remove lojas em cascata
6. `PUT /api/admin/stores/:id` em loja de outro tenant retorna `404`
7. `POST /api/admin/stores` com `category_ids` de outro tenant retorna `422`
8. Cache Redis de listagem fica separado por tenant (`stores:list:{tenantId}:...`)

## Infra de teste

- Banco de teste dedicado: `scp_test`
- Schema usado na suite: `scp`
- Redis usado na suite: DB logico `15`
- Reset entre testes:
  - `FLUSHDB` no Redis de teste
  - `TRUNCATE ... CASCADE` em `tb_store_category`, `tb_store`, `tb_category`, `tb_refresh_token`, `tb_user`, `tb_tenant`

## Resultado

**Sessão #1 (2026-05-14):**
- `npm run typecheck -w backend`: verde
- `npm test -w backend`: verde (`71/71` à época; `74/74` após PRs #7-#10 mergeados)
- `npm run test:isolation`: suite implementada, mas execução local bloqueada por infraestrutura ausente (`ECONNREFUSED 127.0.0.1:5435`, sem WSL, sem Docker).

**Sessão #2 (2026-05-18) — execução final no CI:**
- 5 commits resolveram o gap entre "código pronto" e "suite verde":
  1. Merge de `main` (resolução de conflitos pós-PR #16)
  2. Acentos lint + Redis port alinhado pra `6379` (PR #7)
  3. `ensureTestDatabase()` cria schema `scp` antes de `runMigrations()`
  4. Globs de migrations absolutos em `AppDataSource` (path resolvido via `__dirname`, não CWD)
  5. `ts-node/register` no `setupFiles` do Vitest pra `require('.ts')` do TypeORM funcionar
- **CI verde:** 12/12 checks no commit `b38052c`; job `isolation tests` executa os 8 cenários contra Postgres + Redis reais (services do workflow).

## Como validar localmente

1. Suba Postgres e Redis nas portas do projeto (`5435` e `6379`)
2. Rode:

```bash
npm run test:isolation
```

3. Resultado esperado:

```text
8 testes verdes em tests/isolation/stores.test.ts
```

## Como validar falha proposital

1. Comente temporariamente o `withTenant(...)` em uma query de stores
2. Rode novamente:

```bash
npm run test:isolation
```

3. Pelo menos um dos cenarios 1, 2, 6 ou 8 deve falhar
4. Reverta a alteracao logo em seguida

## Observacoes importantes

- O backlog pressupunha rotas de detalhe/admin que ainda nao existiam no backend. Elas foram abertas nesta fase de forma minima para que a suite testasse comportamento real, nao mocks.
- O modelo atual nao possui superadmin global. O helper `setupTenants()` cria um usuario com role `superadmin` associado ao `tenant1` apenas como compatibilidade de fixture, sem mudar o dominio atual.
