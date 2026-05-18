import type Redis from 'ioredis';
import { redis as sharedRedis } from '../config/redis';
import { config } from '../config';
import type { Tenant } from '../entities/Tenant';
import type { TenantContext } from '../middleware/tenant-context';
import type { TenantRepository } from '../repositories/tenant.repository';
import { logger } from '../utils/logger';

const CACHE_KEY_PREFIX = 'tenant:resolve:';
const CACHE_TTL_SECONDS = config.cache.tenantTtlSeconds;

function buildTenantCacheKey(host: string): string {
  return CACHE_KEY_PREFIX + host;
}

function isTenantContext(value: unknown): value is TenantContext {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.tenantId === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.flavorSlug === 'string'
  );
}

function parseTenantContext(raw: string): TenantContext {
  const parsed: unknown = JSON.parse(raw);
  if (!isTenantContext(parsed)) {
    throw new Error('cached tenant payload has invalid shape');
  }
  return parsed;
}

function toTenantContext(tenant: Tenant): TenantContext {
  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    flavorSlug: tenant.flavorSlug,
  };
}

async function deleteTenantCacheEntry(
  redisClient: Pick<Redis, 'del'>,
  host: string,
): Promise<void> {
  const key = buildTenantCacheKey(host);

  try {
    await redisClient.del(key);
    logger.info('tenant cache invalidated', { host, key });
  } catch (err) {
    logger.warn('tenant cache invalidation failed', {
      host,
      key,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function invalidateTenantCache(host: string): Promise<void> {
  await deleteTenantCacheEntry(sharedRedis, host);
}

/**
 * Resolve um tenant a partir do `host` HTTP da request, usando cache
 * Redis em `tenant:resolve:{host}`.
 *
 * Cache miss -> query no Postgres -> grava em Redis com TTL configuravel.
 * Cache hit -> retorna direto (nao toca o banco).
 *
 * Se o Redis estiver indisponivel, cai para o banco sem quebrar a request.
 * Nao cacheamos `null` para evitar 404 stale apos cadastro de um tenant novo.
 */
export class TenantResolverService {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly redis: Redis,
  ) {}

  async resolveByHost(host: string): Promise<TenantContext | null> {
    const key = buildTenantCacheKey(host);

    try {
      const cached = await this.redis.get(key);
      if (cached !== null) {
        logger.info('tenant cache HIT', { host, key });
        return parseTenantContext(cached);
      }

      logger.info('tenant cache MISS', { host, key });
    } catch (err) {
      logger.warn('tenant cache unavailable, falling back to database', {
        host,
        key,
        message: err instanceof Error ? err.message : String(err),
      });
    }

    const tenant = await this.tenantRepo.findByHost(host);
    if (!tenant) {
      logger.info('tenant resolve not found', { host });
      return null;
    }

    const ctx = toTenantContext(tenant);

    try {
      await this.redis.set(key, JSON.stringify(ctx), 'EX', CACHE_TTL_SECONDS);
      logger.info('tenant cache write OK', {
        host,
        key,
        ttlSeconds: CACHE_TTL_SECONDS,
      });
    } catch (err) {
      logger.warn('tenant cache write failed', {
        host,
        key,
        ttlSeconds: CACHE_TTL_SECONDS,
        message: err instanceof Error ? err.message : String(err),
      });
    }

    return ctx;
  }

  async invalidate(host: string): Promise<void> {
    await deleteTenantCacheEntry(this.redis, host);
  }
}
