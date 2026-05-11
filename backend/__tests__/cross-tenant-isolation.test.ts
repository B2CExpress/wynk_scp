/**
 * Critério de aceite SPEC-1505: "tentativa de query sem tenant_id falha".
 *
 * Cobertura:
 *   - `TenantSubscriber.beforeInsert` — injeta, rejeita ausência, rejeita cross-tenant,
 *     ignora a própria entity Tenant.
 *   - `TenantSubscriber.beforeUpdate` — proíbe mudança em tenant_id.
 *   - `withTenant` — falha sem ctx, aplica WHERE com tenantId do ctx.
 *
 * Testes unitários sem TypeORM/DB reais: usamos shapes mínimos pros eventos
 * (InsertEvent / UpdateEvent) e um stub de SelectQueryBuilder.
 */
import type { InsertEvent, UpdateEvent, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { TenantSubscriber } from '../src/subscribers/TenantSubscriber';
import { Tenant } from '../src/entities/Tenant';
import { withTenant } from '../src/utils/with-tenant';
import { runWithTenantContext, type TenantContext } from '../src/middleware/tenant-context';

const CTX: TenantContext = {
  tenantId: 'tenant-a',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

function makeInsertEvent(
  entity: Record<string, unknown> | null,
  target: Function = class FakeMultitenantEntity {},
  tableName = 'tb_fake',
): InsertEvent<Record<string, unknown>> {
  return {
    entity,
    metadata: { target, tableName },
  } as unknown as InsertEvent<Record<string, unknown>>;
}

function makeUpdateEvent(
  updatedColumns: Array<{ propertyName: string }>,
  target: Function = class FakeMultitenantEntity {},
  tableName = 'tb_fake',
): UpdateEvent<Record<string, unknown>> {
  return {
    updatedColumns,
    metadata: { target, tableName },
  } as unknown as UpdateEvent<Record<string, unknown>>;
}

describe('TenantSubscriber.beforeInsert', () => {
  const subscriber = new TenantSubscriber();

  it('throws when entity has tenantId property but neither value nor ctx is set', () => {
    const entity = { tenantId: undefined, name: 'x' };
    const event = makeInsertEvent(entity, undefined, 'tb_store');

    expect(() => subscriber.beforeInsert(event)).toThrow(/INSERT em tb_store sem tenant_id/);
  });

  it('injects tenantId from ctx when entity has the property but no value', () => {
    const entity: { tenantId?: string } = { tenantId: undefined };
    const event = makeInsertEvent(entity);

    runWithTenantContext(CTX, () => {
      subscriber.beforeInsert(event);
    });

    expect(entity.tenantId).toBe(CTX.tenantId);
  });

  it('rejects cross-tenant INSERT (entity.tenantId != ctx.tenantId)', () => {
    const entity = { tenantId: 'tenant-OTHER' };
    const event = makeInsertEvent(entity, undefined, 'tb_store');

    expect(() =>
      runWithTenantContext(CTX, () => {
        subscriber.beforeInsert(event);
      }),
    ).toThrow(/Cross-tenant INSERT detectado em tb_store/);
  });

  it('accepts INSERT when entity.tenantId matches ctx.tenantId', () => {
    const entity = { tenantId: CTX.tenantId };
    const event = makeInsertEvent(entity);

    expect(() =>
      runWithTenantContext(CTX, () => {
        subscriber.beforeInsert(event);
      }),
    ).not.toThrow();
  });

  it('accepts INSERT with manual tenantId when no ctx is active (seed/script path)', () => {
    const entity = { tenantId: 'tenant-a' };
    const event = makeInsertEvent(entity);

    expect(() => subscriber.beforeInsert(event)).not.toThrow();
    expect(entity.tenantId).toBe('tenant-a');
  });

  it('ignores entities without the tenantId property (catalog tables)', () => {
    const entity = { id: '1', name: 'x' };
    const event = makeInsertEvent(entity);

    expect(() => subscriber.beforeInsert(event)).not.toThrow();
  });

  it('ignores the Tenant entity itself (its PK IS the tenant_id)', () => {
    const entity = { tenantId: 'should-be-ignored' };
    const event = makeInsertEvent(entity, Tenant, 'tb_tenant');

    expect(() => subscriber.beforeInsert(event)).not.toThrow();
    // ctx não foi aplicado porque o subscriber ignora Tenant
    expect(entity.tenantId).toBe('should-be-ignored');
  });
});

describe('TenantSubscriber.beforeUpdate', () => {
  const subscriber = new TenantSubscriber();

  it('rejects UPDATE that touches the tenantId column', () => {
    const event = makeUpdateEvent([{ propertyName: 'tenantId' }], undefined, 'tb_store');

    expect(() => subscriber.beforeUpdate(event)).toThrow(
      /UPDATE de tenant_id em tb_store é proibido/,
    );
  });

  it('accepts UPDATE that does not touch tenantId', () => {
    const event = makeUpdateEvent([{ propertyName: 'name' }, { propertyName: 'price' }]);

    expect(() => subscriber.beforeUpdate(event)).not.toThrow();
  });

  it('ignores UPDATE on the Tenant entity itself', () => {
    // Tenant tem property `id` (mapeada pra tenant_id), não `tenantId` —
    // mas mesmo se updatedColumns incluísse algo chamado tenantId, o
    // subscriber retorna cedo por causa do target check.
    const event = makeUpdateEvent([{ propertyName: 'tenantId' }], Tenant, 'tb_tenant');

    expect(() => subscriber.beforeUpdate(event)).not.toThrow();
  });
});

describe('withTenant', () => {
  function makeQueryBuilderStub(alias = 'store'): SelectQueryBuilder<ObjectLiteral> {
    const calls: Array<{ where: string; params: Record<string, unknown> }> = [];
    const qb = {
      alias,
      andWhere(where: string, params: Record<string, unknown>) {
        calls.push({ where, params });
        return qb;
      },
      _calls: calls,
    } as unknown as SelectQueryBuilder<ObjectLiteral> & {
      _calls: Array<{ where: string; params: Record<string, unknown> }>;
    };
    return qb;
  }

  it('throws outside of a tenant context', () => {
    const qb = makeQueryBuilderStub();

    expect(() => withTenant(qb)).toThrow(/No tenant context/);
  });

  it('applies WHERE <alias>.tenant_id = :__tenantId with ctx.tenantId', () => {
    const qb = makeQueryBuilderStub('store');
    const calls = (
      qb as unknown as { _calls: Array<{ where: string; params: Record<string, unknown> }> }
    )._calls;

    runWithTenantContext(CTX, () => {
      withTenant(qb);
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].where).toBe('store.tenant_id = :__tenantId');
    expect(calls[0].params).toEqual({ __tenantId: CTX.tenantId });
  });

  it('uses the QueryBuilder alias dynamically', () => {
    const qb = makeQueryBuilderStub('product');
    const calls = (
      qb as unknown as { _calls: Array<{ where: string; params: Record<string, unknown> }> }
    )._calls;

    runWithTenantContext(CTX, () => {
      withTenant(qb);
    });

    expect(calls[0].where).toBe('product.tenant_id = :__tenantId');
  });
});
