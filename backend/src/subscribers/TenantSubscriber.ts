import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { getTenantContext } from '../middleware/tenant-context';
import { Tenant } from '../entities/Tenant';

/**
 * Subscriber global que injeta `tenant_id` em INSERT/UPDATE de qualquer
 * entity que tenha a propriedade `tenantId` declarada.
 *
 * Lógica:
 *   - Antes de INSERT: se a entity tem `tenantId` e o valor não foi setado
 *     manualmente, popula a partir do `AsyncLocalStorage`.
 *   - Antes de UPDATE: se há mudança em `tenantId`, REJEITA — alterar tenant
 *     de uma row é cross-tenant move, e exigimos operação explícita (não
 *     implícita via update normal).
 *
 * **Exceção:** a própria entity `Tenant` é ignorada — sua PK já É o tenant_id,
 * não há coluna `tenant_id` separada.
 */
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<Record<string, unknown>>): void {
    if (event.metadata.target === Tenant) {
      return;
    }
    if (!('tenantId' in (event.entity ?? {}))) {
      return;
    }

    const ctx = getTenantContext();
    const entity = event.entity as { tenantId?: string };

    if (!entity.tenantId) {
      if (!ctx) {
        throw new Error(
          `INSERT em ${event.metadata.tableName} sem tenant_id: nem o entity tinha tenantId, nem havia TenantContext ativo. Use runWithTenantContext() ou middleware antes da operação.`,
        );
      }
      entity.tenantId = ctx.tenantId;
    } else if (ctx && entity.tenantId !== ctx.tenantId) {
      throw new Error(
        `Cross-tenant INSERT detectado em ${event.metadata.tableName}: entity.tenantId=${entity.tenantId} != ctx.tenantId=${ctx.tenantId}.`,
      );
    }
  }

  beforeUpdate(event: UpdateEvent<Record<string, unknown>>): void {
    if (event.metadata.target === Tenant) {
      return;
    }
    if (!event.updatedColumns.some((col) => col.propertyName === 'tenantId')) {
      return;
    }
    throw new Error(
      `UPDATE de tenant_id em ${event.metadata.tableName} é proibido — mudança de tenant exige operação explícita (delete+insert ou migration cuidadosa).`,
    );
  }
}
