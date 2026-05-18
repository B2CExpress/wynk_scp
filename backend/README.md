# Backend

## Regra obrigatoria de isolamento por tenant

Toda query de feature que toca dados multitenant deve passar pelo helper `withTenant`.

- Para requests HTTP, use `withTenant(qb)` em `QueryBuilder` (tenant vem do `AsyncLocalStorage`).
- Para scripts/processos fora de request, use `withTenantScope(tenantId)` com UUID v4 valido.

Nao importar `AppDataSource` diretamente em codigo de feature para montar query sem escopo de tenant.

## Exemplo rapido

```ts
import { withTenant } from './src/utils/with-tenant';

const qb = withTenant(storeRepo.createQueryBuilder('store')).andWhere(
  'store.store_status = :status',
  { status: 'active' },
);
```

```ts
import { withTenantScope } from './src/utils/with-tenant';

const scoped = withTenantScope('11111111-1111-4111-8111-111111111111');
const values = scoped.insertValues({ name: 'Store X' });
await storeRepo.insert(values);
```
