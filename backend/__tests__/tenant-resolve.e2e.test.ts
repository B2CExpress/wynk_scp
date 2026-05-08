import request from 'supertest';
import { createApp } from '../src/app';
import { makeAppDeps, makeFakeTenantResolver } from './helpers/mock-deps';
import type { TenantContext } from '../src/middleware/tenant-context';

const tenantCtx: TenantContext = {
  tenantId: '00000000-0000-0000-0000-000000000001',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

describe('GET /tenant/resolve', () => {
  it('returns 404 when host does not match any tenant', async () => {
    process.env.NODE_ENV = 'test';
    const app = createApp(makeAppDeps());

    const res = await request(app).get('/tenant/resolve').set('Host', 'nope.local');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'tenant_not_found' });
  });

  it('returns the resolved tenant when host matches', async () => {
    process.env.NODE_ENV = 'test';
    const map = new Map<string, TenantContext>([['shopping-x.local', tenantCtx]]);
    const app = createApp(makeAppDeps({ tenantResolver: makeFakeTenantResolver(map) }));

    await request(app)
      .get('/tenant/resolve')
      .set('Host', 'shopping-x.local')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          id: tenantCtx.tenantId,
          slug: tenantCtx.slug,
          flavorSlug: tenantCtx.flavorSlug,
        });
      });
  });

  it('still serves /health without tenant resolution', async () => {
    process.env.NODE_ENV = 'test';
    const app = createApp(makeAppDeps());

    await request(app).get('/health').set('Host', 'unknown.local').expect(200);
  });
});
