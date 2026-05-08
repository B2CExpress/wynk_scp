import type Redis from 'ioredis';
import type { TenantRepository } from '../repositories/tenant.repository';
import type { TenantContext } from '../middleware/tenant-context';

const CACHE_KEY_PREFIX = 'tenant:resolve:';
const CACHE_TTL_SECONDS = 600; // 10 min — alinhado com SPEC-1505 §Implementação

/**
 * Resolve um tenant a partir do `host` HTTP da request, usando cache
 * Redis em `tenant:resolve:{host}`.
 *
 * Cache miss → query no Postgres → grava em Redis com TTL 10 min.
 * Cache hit → retorna direto (não toca o banco).
 *
 * Invalidação: chamar `invalidate(oldHost)` após UPDATE de `tenant_host`
 * ou `tenant_flavor_slug`. Operação rara (mudança de identidade do tenant).
 */
export class TenantResolverService {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly redis: Redis,
  ) {}

  async resolveByHost(host: string): Promise<TenantContext | null> {
    const key = CACHE_KEY_PREFIX + host;

    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as TenantContext;
    }

    const tenant = await this.tenantRepo.findByHost(host);
    if (!tenant) {
      return null;
    }

    const ctx: TenantContext = {
      tenantId: tenant.id,
      slug: tenant.slug,
      flavorSlug: tenant.flavorSlug,
    };
    await this.redis.set(key, JSON.stringify(ctx), 'EX', CACHE_TTL_SECONDS);
    return ctx;
  }

  async invalidate(host: string): Promise<void> {
    await this.redis.del(CACHE_KEY_PREFIX + host);
  }
}
