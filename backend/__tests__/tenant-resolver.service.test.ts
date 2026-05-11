import { TenantResolverService } from '../src/services/tenant-resolver.service';
import type { TenantRepository } from '../src/repositories/tenant.repository';
import type { Tenant } from '../src/entities/Tenant';
import type Redis from 'ioredis';

function makeRepoMock(tenant: Tenant | null): TenantRepository {
  return {
    findByHost: jest.fn(async () => tenant),
    findBySlug: jest.fn(async () => tenant),
    findById: jest.fn(async () => tenant),
  } as unknown as TenantRepository;
}

function makeRedisMock(): {
  redis: Redis;
  store: Map<string, string>;
  setSpy: jest.Mock;
  getSpy: jest.Mock;
  delSpy: jest.Mock;
} {
  const store = new Map<string, string>();
  const getSpy = jest.fn(async (key: string) => store.get(key) ?? null);
  const setSpy = jest.fn(async (key: string, value: string) => {
    store.set(key, value);
    return 'OK' as const;
  });
  const delSpy = jest.fn(async (key: string) => {
    const had = store.delete(key);
    return had ? 1 : 0;
  });
  const redis = { get: getSpy, set: setSpy, del: delSpy } as unknown as Redis;
  return { redis, store, setSpy, getSpy, delSpy };
}

const tenantRow: Tenant = {
  id: '00000000-0000-0000-0000-000000000001',
  slug: 'shopping-x',
  host: 'shopping-x.local',
  flavorSlug: 'shopping-x',
  name: 'Shopping X',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TenantResolverService.resolveByHost', () => {
  it('returns null when no tenant matches the host', async () => {
    const repo = makeRepoMock(null);
    const { redis } = makeRedisMock();
    const service = new TenantResolverService(repo, redis);

    const result = await service.resolveByHost('unknown.local');

    expect(result).toBeNull();
    expect(repo.findByHost).toHaveBeenCalledWith('unknown.local');
  });

  it('hits the database on cache miss and stores the result with TTL 600s', async () => {
    const repo = makeRepoMock(tenantRow);
    const { redis, setSpy, getSpy } = makeRedisMock();
    const service = new TenantResolverService(repo, redis);

    const ctx = await service.resolveByHost('shopping-x.local');

    expect(ctx).toEqual({
      tenantId: tenantRow.id,
      slug: tenantRow.slug,
      flavorSlug: tenantRow.flavorSlug,
    });
    expect(getSpy).toHaveBeenCalledWith('tenant:resolve:shopping-x.local');
    expect(repo.findByHost).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith(
      'tenant:resolve:shopping-x.local',
      JSON.stringify(ctx),
      'EX',
      600,
    );
  });

  it('returns from cache without touching the database on second call', async () => {
    const repo = makeRepoMock(tenantRow);
    const { redis } = makeRedisMock();
    const service = new TenantResolverService(repo, redis);

    await service.resolveByHost('shopping-x.local'); // populates cache
    const ctx2 = await service.resolveByHost('shopping-x.local'); // hits cache

    expect(ctx2).toEqual({
      tenantId: tenantRow.id,
      slug: tenantRow.slug,
      flavorSlug: tenantRow.flavorSlug,
    });
    expect(repo.findByHost).toHaveBeenCalledTimes(1);
  });

  it('removes the cache entry on invalidate(host)', async () => {
    const repo = makeRepoMock(tenantRow);
    const { redis, store, delSpy } = makeRedisMock();
    const service = new TenantResolverService(repo, redis);

    await service.resolveByHost('shopping-x.local');
    expect(store.has('tenant:resolve:shopping-x.local')).toBe(true);

    await service.invalidate('shopping-x.local');

    expect(delSpy).toHaveBeenCalledWith('tenant:resolve:shopping-x.local');
    expect(store.has('tenant:resolve:shopping-x.local')).toBe(false);
  });

  // SPEC-1505 critério: "Invalidação de cache ao alterar host ou flavor_slug funciona"
  it('repopulates the cache with fresh data after invalidate (flavorSlug change)', async () => {
    const initial: Tenant = { ...tenantRow };
    const swapped: Tenant = { ...tenantRow, flavorSlug: 'shopping-x-rebrand' };
    const findByHost = jest
      .fn<Promise<Tenant | null>, [string]>()
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(swapped);
    const repo = { findByHost } as unknown as TenantRepository;
    const { redis } = makeRedisMock();
    const service = new TenantResolverService(repo, redis);

    const before = await service.resolveByHost('shopping-x.local');
    expect(before?.flavorSlug).toBe('shopping-x');

    // segunda resolução sem invalidate: vem do cache, ainda com flavor antigo
    const stillCached = await service.resolveByHost('shopping-x.local');
    expect(stillCached?.flavorSlug).toBe('shopping-x');
    expect(findByHost).toHaveBeenCalledTimes(1);

    await service.invalidate('shopping-x.local');

    const after = await service.resolveByHost('shopping-x.local');
    expect(after?.flavorSlug).toBe('shopping-x-rebrand');
    expect(findByHost).toHaveBeenCalledTimes(2);
  });

  it('invalidating an unknown host is a no-op (does not throw)', async () => {
    const repo = makeRepoMock(null);
    const { redis, delSpy } = makeRedisMock();
    const service = new TenantResolverService(repo, redis);

    await expect(service.invalidate('never-cached.local')).resolves.toBeUndefined();
    expect(delSpy).toHaveBeenCalledWith('tenant:resolve:never-cached.local');
  });
});
