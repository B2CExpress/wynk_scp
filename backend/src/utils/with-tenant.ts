import type { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { requireTenantContext } from '../middleware/tenant-context';

/**
 * Aplica `WHERE <alias>.tenant_id = :tenantId` a um QueryBuilder, garantindo
 * isolamento de dados por tenant. Lê o `tenantId` do `AsyncLocalStorage`
 * via `requireTenantContext()` — falha explicitamente se chamado fora de
 * uma request multitenant.
 *
 * Uso típico em repositórios:
 *
 * ```ts
 * const stores = await withTenant(
 *   storeRepository.createQueryBuilder('store'),
 * ).getMany();
 * ```
 *
 * O alias é deduzido automaticamente do QueryBuilder. Se a tabela não tem
 * coluna `tenant_id` (ex.: `tb_tenant` em si), NÃO use `withTenant` — a
 * própria PK já é o `tenant_id`.
 */
export function withTenant<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> {
  const ctx = requireTenantContext();
  const alias = qb.alias;
  return qb.andWhere(`${alias}.tenant_id = :__tenantId`, {
    __tenantId: ctx.tenantId,
  });
}
