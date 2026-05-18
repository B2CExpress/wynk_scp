import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loginAs } from '../helpers/auth';
import {
  createCategoryFixture,
  createIsolationContext,
  createStoreFixture,
  destroyIsolationContext,
  resetIsolationState,
  setupTenants,
} from '../helpers/setup';

function tenantHeaders(host: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    'X-Forwarded-Host': host,
    ...extra,
  };
}

describe('stores tenant isolation', () => {
  let baseUrl: string;

  beforeAll(async () => {
    const context = await createIsolationContext();
    baseUrl = context.baseUrl;
  });

  beforeEach(async () => {
    await resetIsolationState();
  });

  afterAll(async () => {
    await destroyIsolationContext();
  });

  it('cenario 1: listar lojas em tenant1 nao retorna lojas de tenant2', async () => {
    const fixtures = await setupTenants();
    const store1 = await createStoreFixture({
      tenantId: fixtures.tenant1.id,
      slug: 'tenant1-store',
      name: 'Tenant 1 Store',
    });
    const store2 = await createStoreFixture({
      tenantId: fixtures.tenant2.id,
      slug: 'tenant2-store',
      name: 'Tenant 2 Store',
    });

    const response = await fetch(`${baseUrl}/api/v1/stores`, {
      headers: tenantHeaders(fixtures.tenant1.host),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.map((store: { id: string }) => store.id)).toContain(store1.id);
    expect(body.data.map((store: { id: string }) => store.id)).not.toContain(store2.id);
  });

  it('cenario 2: buscar loja por slug que so existe em tenant2 estando em tenant1 retorna 404', async () => {
    const fixtures = await setupTenants();
    await createStoreFixture({
      tenantId: fixtures.tenant2.id,
      slug: 'slug-tenant2',
      name: 'Store Tenant 2',
    });

    const response = await fetch(`${baseUrl}/api/v1/stores/slug-tenant2`, {
      headers: tenantHeaders(fixtures.tenant1.host),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'store_not_found' });
  });

  it('cenario 3: admin de tenant1 tenta criar loja com tenant_id de tenant2 no payload e o tenant da sessao vence', async () => {
    const fixtures = await setupTenants();
    const authHeaders = await loginAs({
      baseUrl,
      slug: fixtures.tenant1.slug,
      email: fixtures.admin1.email,
      password: fixtures.password,
    });

    const response = await fetch(`${baseUrl}/api/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders(fixtures.tenant1.host, authHeaders),
      },
      body: JSON.stringify({
        name: 'Loja Ignora Tenant',
        slug: 'ignora-tenant-id',
        tenant_id: fixtures.tenant2.id,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.tenantId).toBe(fixtures.tenant1.id);
  });

  it('cenario 4: slug duplicado em tenants diferentes e OK', async () => {
    const fixtures = await setupTenants();
    const admin1Headers = await loginAs({
      baseUrl,
      slug: fixtures.tenant1.slug,
      email: fixtures.admin1.email,
      password: fixtures.password,
    });
    const admin2Headers = await loginAs({
      baseUrl,
      slug: fixtures.tenant2.slug,
      email: fixtures.admin2.email,
      password: fixtures.password,
    });

    const response1 = await fetch(`${baseUrl}/api/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders(fixtures.tenant1.host, admin1Headers),
      },
      body: JSON.stringify({ name: 'Renner T1', slug: 'renner' }),
    });
    const response2 = await fetch(`${baseUrl}/api/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders(fixtures.tenant2.host, admin2Headers),
      },
      body: JSON.stringify({ name: 'Renner T2', slug: 'renner' }),
    });

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);

    const body1 = await response1.json();
    const body2 = await response2.json();
    expect(body1.tenantId).toBe(fixtures.tenant1.id);
    expect(body2.tenantId).toBe(fixtures.tenant2.id);
    expect(body1.slug).toBe('renner');
    expect(body2.slug).toBe('renner');
  });

  it('cenario 5: deletar tenant remove em cascata todas as suas lojas', async () => {
    const fixtures = await setupTenants();
    const context = await createIsolationContext();
    const store = await createStoreFixture({
      tenantId: fixtures.tenant1.id,
      slug: 'cascade-store',
      name: 'Cascade Store',
    });

    const beforeDelete = await context.databaseModule.AppDataSource.query(
      'SELECT count(*)::int AS total FROM scp.tb_store WHERE tenant_id = $1',
      [fixtures.tenant1.id],
    );
    expect(beforeDelete[0].total).toBe(1);

    await context.databaseModule.AppDataSource.query(
      'DELETE FROM scp.tb_tenant WHERE tenant_id = $1',
      [fixtures.tenant1.id],
    );

    const afterDelete = await context.databaseModule.AppDataSource.query(
      'SELECT count(*)::int AS total FROM scp.tb_store WHERE tenant_id = $1',
      [store.tenantId],
    );
    expect(afterDelete[0].total).toBe(0);
  });

  it('cenario 6: admin de tenant1 tenta atualizar loja de tenant2 via id direto e recebe 404', async () => {
    const fixtures = await setupTenants();
    const store2 = await createStoreFixture({
      tenantId: fixtures.tenant2.id,
      slug: 'update-tenant2',
      name: 'Store Update Tenant 2',
    });
    const authHeaders = await loginAs({
      baseUrl,
      slug: fixtures.tenant1.slug,
      email: fixtures.admin1.email,
      password: fixtures.password,
    });

    const response = await fetch(`${baseUrl}/api/admin/stores/${store2.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders(fixtures.tenant1.host, authHeaders),
      },
      body: JSON.stringify({ name: 'Nao Pode Atualizar' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'store_not_found' });
  });

  it('cenario 7: admin de tenant1 tenta vincular categoria de tenant2 a loja sua e recebe 422', async () => {
    const fixtures = await setupTenants();
    const categoryTenant2 = await createCategoryFixture({
      tenantId: fixtures.tenant2.id,
      slug: 'categoria-tenant2',
      name: 'Categoria Tenant 2',
    });
    const authHeaders = await loginAs({
      baseUrl,
      slug: fixtures.tenant1.slug,
      email: fixtures.admin1.email,
      password: fixtures.password,
    });

    const response = await fetch(`${baseUrl}/api/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tenantHeaders(fixtures.tenant1.host, authHeaders),
      },
      body: JSON.stringify({
        name: 'Store Categoria Invalida',
        slug: 'store-cat-invalida',
        category_ids: [categoryTenant2.id],
      }),
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: 'invalid_category_ids' });
  });

  it('cenario 8: cache do Redis e separado por tenant', async () => {
    const fixtures = await setupTenants();
    const context = await createIsolationContext();
    await createStoreFixture({
      tenantId: fixtures.tenant1.id,
      slug: 'cache-tenant1',
      name: 'Cache Tenant 1',
    });
    await createStoreFixture({
      tenantId: fixtures.tenant2.id,
      slug: 'cache-tenant2',
      name: 'Cache Tenant 2',
    });

    const response1 = await fetch(`${baseUrl}/api/v1/stores`, {
      headers: tenantHeaders(fixtures.tenant1.host),
    });
    expect(response1.status).toBe(200);
    expect(response1.headers.get('x-cache')).toBe('MISS');

    const keysAfterTenant1 = await context.redis.keys('stores:list:*');
    expect(keysAfterTenant1.some((key) => key.includes(fixtures.tenant1.id))).toBe(true);
    expect(keysAfterTenant1.some((key) => key.includes(fixtures.tenant2.id))).toBe(false);

    const response2 = await fetch(`${baseUrl}/api/v1/stores`, {
      headers: tenantHeaders(fixtures.tenant2.host),
    });
    expect(response2.status).toBe(200);
    expect(response2.headers.get('x-cache')).toBe('MISS');

    const keysAfterTenant2 = await context.redis.keys('stores:list:*');
    expect(keysAfterTenant2.some((key) => key.includes(fixtures.tenant1.id))).toBe(true);
    expect(keysAfterTenant2.some((key) => key.includes(fixtures.tenant2.id))).toBe(true);
  });
});
