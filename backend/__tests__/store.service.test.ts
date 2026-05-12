import type Redis from 'ioredis';
import { StoreService } from '../src/services/store.service';
import type { StoreRepository } from '../src/repositories/store.repository';
import type { StoreListQuery, StoreListItem } from '../src/dtos/store-list.dto';
import { runWithTenantContext, type TenantContext } from '../src/middleware/tenant-context';

const CTX: TenantContext = {
  tenantId: 'tenant-a',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

const SAMPLE_ITEM: StoreListItem = {
  id: 'store-1',
  name: 'McDonald',
  slug: 'mcdonald',
  logoUrl: null,
  coverImageUrl: null,
  floor: '1',
  phone: null,
  isRestaurant: true,
  isFeatured: false,
  sortOrder: 0,
};

const DEFAULT_QUERY: StoreListQuery = {
  category: undefined,
  featured: undefined,
  isRestaurant: undefined,
  search: undefined,
  page: 1,
  limit: 20,
};

function makeRepoMock(
  result: { items: StoreListItem[]; total: number } = { items: [SAMPLE_ITEM], total: 1 },
): { repo: StoreRepository; findSpy: jest.Mock } {
  const findSpy = jest.fn(async () => result);
  const repo = { findActiveListing: findSpy } as unknown as StoreRepository;
  return { repo, findSpy };
}

function makeRedisMock(): {
  redis: Redis;
  store: Map<string, string>;
  getSpy: jest.Mock;
  setSpy: jest.Mock;
  scanSpy: jest.Mock;
  delSpy: jest.Mock;
} {
  const store = new Map<string, string>();
  const getSpy = jest.fn(async (key: string) => store.get(key) ?? null);
  const setSpy = jest.fn(async (key: string, value: string) => {
    store.set(key, value);
    return 'OK' as const;
  });
  const scanSpy = jest.fn(async (cursor: string, _match: string, pattern: string) => {
    const keys = [...store.keys()].filter((k) => {
      // glob pattern simples: só suporta '*' no fim, que é o caso da SPEC.
      const prefix = pattern.replace(/\*$/, '');
      return k.startsWith(prefix);
    });
    void cursor;
    void _match;
    return ['0', keys];
  });
  const delSpy = jest.fn(async (...keys: string[]) => {
    let count = 0;
    for (const k of keys) {
      if (store.delete(k)) count++;
    }
    return count;
  });
  const redis = {
    get: getSpy,
    set: setSpy,
    scan: scanSpy,
    del: delSpy,
  } as unknown as Redis;
  return { redis, store, getSpy, setSpy, scanSpy, delSpy };
}

describe('StoreService.listActive', () => {
  it('cache MISS on first call: queries the repository and stores the result', async () => {
    const { repo, findSpy } = makeRepoMock();
    const { redis, store, setSpy } = makeRedisMock();
    const service = new StoreService(repo, redis);

    const { response, cacheHit } = await runWithTenantContext(CTX, () =>
      service.listActive(DEFAULT_QUERY),
    );

    expect(cacheHit).toBe(false);
    expect(response).toEqual({ data: [SAMPLE_ITEM], total: 1, page: 1, limit: 20 });
    expect(findSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledTimes(1);
    // chave começa com `stores:list:{tenant_id}:` (prefixo usado pela invalidação)
    expect([...store.keys()][0]).toMatch(/^stores:list:tenant-a:/);
  });

  it('cache HIT on second identical call: skips the repository', async () => {
    const { repo, findSpy } = makeRepoMock();
    const { redis } = makeRedisMock();
    const service = new StoreService(repo, redis);

    await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));
    const { cacheHit } = await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));

    expect(cacheHit).toBe(true);
    expect(findSpy).toHaveBeenCalledTimes(1);
  });

  it('different filters compose different cache keys (no false HIT)', async () => {
    const { repo, findSpy } = makeRepoMock();
    const { redis, store } = makeRedisMock();
    const service = new StoreService(repo, redis);

    await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));
    await runWithTenantContext(CTX, () =>
      service.listActive({ ...DEFAULT_QUERY, search: 'mcdonald' }),
    );
    await runWithTenantContext(CTX, () => service.listActive({ ...DEFAULT_QUERY, featured: true }));
    await runWithTenantContext(CTX, () => service.listActive({ ...DEFAULT_QUERY, page: 2 }));

    expect(findSpy).toHaveBeenCalledTimes(4);
    expect(store.size).toBe(4);
  });

  it('different tenants get different cache keys (no cross-tenant HIT)', async () => {
    const { repo, findSpy } = makeRepoMock();
    const { redis, store } = makeRedisMock();
    const service = new StoreService(repo, redis);

    await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));
    await runWithTenantContext({ ...CTX, tenantId: 'tenant-b' }, () =>
      service.listActive(DEFAULT_QUERY),
    );

    expect(findSpy).toHaveBeenCalledTimes(2);
    expect(store.size).toBe(2);
    const keys = [...store.keys()];
    expect(keys.some((k) => k.includes(':tenant-a:'))).toBe(true);
    expect(keys.some((k) => k.includes(':tenant-b:'))).toBe(true);
  });

  it('falls back to repository when Redis GET fails (no 500)', async () => {
    const { repo, findSpy } = makeRepoMock();
    const { redis } = makeRedisMock();
    (redis.get as jest.Mock).mockRejectedValueOnce(new Error('redis down'));
    const service = new StoreService(repo, redis);

    const { response, cacheHit } = await runWithTenantContext(CTX, () =>
      service.listActive(DEFAULT_QUERY),
    );

    expect(cacheHit).toBe(false);
    expect(response.data).toEqual([SAMPLE_ITEM]);
    expect(findSpy).toHaveBeenCalledTimes(1);
  });

  it('serves response when Redis SET fails (write-side degradation)', async () => {
    const { repo } = makeRepoMock();
    const { redis } = makeRedisMock();
    (redis.set as jest.Mock).mockRejectedValueOnce(new Error('redis full'));
    const service = new StoreService(repo, redis);

    const { response } = await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));

    expect(response.data).toEqual([SAMPLE_ITEM]);
  });

  it('TTL is 5 minutes (300s)', async () => {
    const { repo } = makeRepoMock();
    const { redis, setSpy } = makeRedisMock();
    const service = new StoreService(repo, redis);

    await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));

    expect(setSpy).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'EX', 300);
  });
});

describe('StoreService.invalidateListings', () => {
  it('SCAN+DEL removes all listing keys for the given tenant', async () => {
    const { repo } = makeRepoMock();
    const { redis, store, scanSpy, delSpy } = makeRedisMock();
    const service = new StoreService(repo, redis);

    // popula com chaves de 2 tenants
    await runWithTenantContext(CTX, () => service.listActive(DEFAULT_QUERY));
    await runWithTenantContext(CTX, () => service.listActive({ ...DEFAULT_QUERY, page: 2 }));
    await runWithTenantContext({ ...CTX, tenantId: 'tenant-b' }, () =>
      service.listActive(DEFAULT_QUERY),
    );

    expect(store.size).toBe(3);

    await service.invalidateListings('tenant-a');

    expect(scanSpy).toHaveBeenCalled();
    expect(delSpy).toHaveBeenCalled();
    // só sobra a chave do tenant-b
    expect(store.size).toBe(1);
    expect([...store.keys()][0]).toContain(':tenant-b:');
  });

  it('does not throw when Redis SCAN fails — invalidation is best-effort', async () => {
    const { repo } = makeRepoMock();
    const { redis } = makeRedisMock();
    (redis.scan as jest.Mock).mockRejectedValueOnce(new Error('redis down'));
    const service = new StoreService(repo, redis);

    await expect(service.invalidateListings('tenant-a')).resolves.toBeUndefined();
  });
});
