import type Redis from 'ioredis';
import { logger } from './logger';

export interface CacheResult<T> {
  data: T;
  hit: boolean;
}

/**
 * Wrap qualquer fetch com cache Redis. Em caso de falha do Redis,
 * cai pra `fetchFn()` sem erro (degradação graciosa) — endpoint público
 * não pode 500 só porque o cache caiu.
 *
 * Retorna `{ data, hit }` para o caller decidir cabeçalhos HTTP (`X-Cache`).
 */
export async function cached<T>(
  redis: Redis,
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<CacheResult<T>> {
  try {
    const cachedRaw = await redis.get(key);
    if (cachedRaw !== null) {
      return { data: JSON.parse(cachedRaw) as T, hit: true };
    }
  } catch (err) {
    logger.warn('cache read failed, falling back to source', {
      key,
      message: err instanceof Error ? err.message : String(err),
    });
    return { data: await fetchFn(), hit: false };
  }

  const data = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn('cache write failed, response served anyway', {
      key,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return { data, hit: false };
}

/**
 * Invalida todas as chaves que casam com `pattern` via SCAN cursor + DEL.
 * **NUNCA usar KEYS em produção** — bloqueia o event loop do Redis.
 *
 * Falha silenciosa: registra warning mas não propaga — invalidação é
 * best-effort (próximo acesso pega o TTL natural).
 */
export async function invalidateByPattern(redis: Redis, pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.warn('cache invalidation failed', {
      pattern,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
