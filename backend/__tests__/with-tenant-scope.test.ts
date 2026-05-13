import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { withTenantScope } from '../src/utils/with-tenant';

const VALID_TENANT_ID = '11111111-1111-4111-8111-111111111111';

type QbCall = {
  where: string;
  params: Record<string, unknown>;
};

function makeSelectQbStub(options?: {
  alias?: string;
  hasTenantColumn?: boolean;
}): SelectQueryBuilder<ObjectLiteral> & {
  _calls: QbCall[];
  toSQL: () => string;
} {
  const alias = options?.alias ?? 'store';
  const hasTenantColumn = options?.hasTenantColumn ?? true;
  const calls: QbCall[] = [];

  const qb = {
    alias,
    expressionMap: {
      mainAlias: {
        targetName: alias,
        metadata: {
          findColumnWithPropertyName: (name: string) =>
            hasTenantColumn && name === 'tenantId' ? { name } : null,
          findColumnWithDatabaseName: (name: string) =>
            hasTenantColumn && name === 'tenant_id' ? { name } : null,
        },
      },
    },
    andWhere(where: string, params: Record<string, unknown>) {
      calls.push({ where, params });
      return qb;
    },
    toSQL() {
      if (calls.length === 0) {
        return `SELECT * FROM ${alias}`;
      }

      const last = calls[calls.length - 1];
      const tenantId = String(last.params.__tenantId ?? '');
      return `SELECT * FROM ${alias} WHERE ${last.where.replace(':__tenantId', `'${tenantId}'`)}`;
    },
    _calls: calls,
  };

  return qb as unknown as SelectQueryBuilder<ObjectLiteral> & {
    _calls: QbCall[];
    toSQL: () => string;
  };
}

describe('withTenantScope', () => {
  it('throws when called with empty tenantId', () => {
    expect(() => withTenantScope('')).toThrow(/tenantId obrigatorio em withTenant/);
  });

  it('throws when tenantId is not a valid UUID v4', () => {
    expect(() => withTenantScope('uuid-fake')).toThrow(/UUID v4 obrigatorio/);
  });

  it('applies WHERE tenant_id filter to SELECT queries', () => {
    const scoped = withTenantScope(VALID_TENANT_ID);
    const qb = makeSelectQbStub({ alias: 'store' });

    const scopedQb = scoped.select(qb) as unknown as { toSQL: () => string };
    const sql = scopedQb.toSQL();

    expect(sql).toContain("WHERE store.tenant_id = '11111111-1111-4111-8111-111111111111'");
  });

  it('injects tenantId into INSERT payload', () => {
    const scoped = withTenantScope(VALID_TENANT_ID);

    const values = scoped.insertValues({ name: 'X' });

    expect(values).toEqual({
      name: 'X',
      tenantId: VALID_TENANT_ID,
    });
  });

  it('fails clearly when table metadata has no tenant_id column', () => {
    const scoped = withTenantScope(VALID_TENANT_ID);
    const qb = makeSelectQbStub({ alias: 'tenant_catalog', hasTenantColumn: false });

    expect(() => scoped.select(qb)).toThrow(/sem tenant_id nao pode usar withTenant/);
  });
});
