import {
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
} from '../src/middleware/tenant-context';

const ctx: TenantContext = {
  tenantId: '11111111-1111-1111-1111-111111111111',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

describe('tenant-context AsyncLocalStorage', () => {
  it('returns undefined outside of a context', () => {
    expect(getTenantContext()).toBeUndefined();
  });

  it('throws when requireTenantContext is called outside of a context', () => {
    expect(() => requireTenantContext()).toThrow(/No tenant context/);
  });

  it('exposes the context inside runWithTenantContext', () => {
    const result = runWithTenantContext(ctx, () => {
      const got = requireTenantContext();
      return got.tenantId;
    });
    expect(result).toBe(ctx.tenantId);
  });

  it('isolates context between concurrent runs', async () => {
    const ctxA: TenantContext = { ...ctx, tenantId: 'aaaa', slug: 'a', flavorSlug: 'a' };
    const ctxB: TenantContext = { ...ctx, tenantId: 'bbbb', slug: 'b', flavorSlug: 'b' };

    const [a, b] = await Promise.all([
      new Promise<string>((resolve) =>
        runWithTenantContext(ctxA, () => {
          setImmediate(() => resolve(requireTenantContext().tenantId));
        }),
      ),
      new Promise<string>((resolve) =>
        runWithTenantContext(ctxB, () => {
          setImmediate(() => resolve(requireTenantContext().tenantId));
        }),
      ),
    ]);

    expect(a).toBe('aaaa');
    expect(b).toBe('bbbb');
  });

  it('clears context after the run completes', () => {
    runWithTenantContext(ctx, () => {
      expect(requireTenantContext().tenantId).toBe(ctx.tenantId);
    });
    expect(getTenantContext()).toBeUndefined();
  });
});
