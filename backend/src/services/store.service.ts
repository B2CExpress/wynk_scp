import type Redis from 'ioredis';
import type { StoreRepository } from '../repositories/store.repository';
import { requireTenantContext } from '../middleware/tenant-context';
import { cached, invalidateByPattern } from '../utils/cache';
import type { StoreListQuery, StoreListResponse } from '../dtos/store-list.dto';

const CACHE_TTL_SECONDS = 300; // 5 min

export interface StoreListResult {
  response: StoreListResponse;
  cacheHit: boolean;
}

/**
 * Compõe a chave de cache de listagem com TODOS os filtros incluídos. Sem
 * isso, cache HIT com filtros diferentes retornaria resultado errado.
 *
 * Convenção: chave começa com `stores:list:{tenant_id}:` (prefixo usado
 * pela invalidação por SCAN). Parâmetros em ordem alfabética. Valores
 * `undefined` viram `-`.
 */
function buildCacheKey(tenantId: string, q: StoreListQuery): string {
  const parts = [
    `cat=${q.category ?? '-'}`,
    `feat=${q.featured === undefined ? '-' : String(q.featured)}`,
    `l=${q.limit}`,
    `p=${q.page}`,
    `q=${q.search ?? '-'}`,
    `rest=${q.isRestaurant === undefined ? '-' : String(q.isRestaurant)}`,
  ];
  return `stores:list:${tenantId}:${parts.join(':')}`;
}

export class StoreService {
  constructor(
    private readonly storeRepo: StoreRepository,
    private readonly redis: Redis,
  ) {}

  async listActive(query: StoreListQuery): Promise<StoreListResult> {
    const { tenantId } = requireTenantContext();
    const key = buildCacheKey(tenantId, query);

    const { data, hit } = await cached(this.redis, key, CACHE_TTL_SECONDS, async () => {
      const { items, total } = await this.storeRepo.findActiveListing(query);
      return {
        data: items,
        total,
        page: query.page,
        limit: query.limit,
      };
    });

    return { response: data, cacheHit: hit };
  }

  /**
   * Invalida todo cache de listagem do tenant atual. Caller futuro:
   * endpoints admin de stores/categories (POST/PUT/DELETE) — chegam em
   * SPEC futura. TTL de 5 min cobre o gap até lá.
   */
  async invalidateListings(tenantId: string): Promise<void> {
    await invalidateByPattern(this.redis, `stores:list:${tenantId}:*`);
  }
}
