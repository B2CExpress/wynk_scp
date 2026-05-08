type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const globalCache = globalThis as typeof globalThis & {
  __publicApiCache__?: Map<string, CacheEntry<unknown>>;
};

const memoryCache = globalCache.__publicApiCache__ ?? new Map<string, CacheEntry<unknown>>();
globalCache.__publicApiCache__ = memoryCache;

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<{ data: T; hit: boolean }> {
  const now = Date.now();
  const cachedEntry = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return {
      data: cachedEntry.value,
      hit: true,
    };
  }

  const value = await fetchFn();
  memoryCache.set(key, {
    expiresAt: now + ttlSeconds * 1000,
    value,
  });

  return {
    data: value,
    hit: false,
  };
}
