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

export interface StoreDetailResponse {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  floor: string | null;
  phone: string | null;
  isRestaurant: boolean;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
}

export interface AdminStoreInput {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  floor?: string | null;
  phone?: string | null;
  isRestaurant?: boolean;
  isFeatured?: boolean;
  status?: string;
  sortOrder?: number;
  categoryIds?: string[];
}

export class StoreNotFoundError extends Error {
  constructor() {
    super('store_not_found');
  }
}

export class InvalidStoreCategoriesError extends Error {
  constructor() {
    super('invalid_store_categories');
  }
}

function serializeStore(store: StoreDetailResponse): StoreDetailResponse {
  return store;
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

  async getActiveBySlug(slug: string): Promise<StoreDetailResponse> {
    const store = await this.storeRepo.findActiveBySlug(slug);
    if (!store) {
      throw new StoreNotFoundError();
    }

    return serializeStore({
      id: store.id,
      tenantId: store.tenantId,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl,
      coverImageUrl: store.coverImageUrl,
      floor: store.floor,
      phone: store.phone,
      isRestaurant: store.isRestaurant,
      isFeatured: store.isFeatured,
      status: store.status,
      sortOrder: store.sortOrder,
    });
  }

  async createAdmin(input: AdminStoreInput): Promise<StoreDetailResponse> {
    if (!input.name || !input.slug) {
      throw new Error('invalid_request');
    }

    const categoryIds = input.categoryIds ?? [];
    if (categoryIds.length > 0) {
      const count = await this.storeRepo.countCategoriesForCurrentTenant(categoryIds);
      if (count !== [...new Set(categoryIds)].length) {
        throw new InvalidStoreCategoriesError();
      }
    }

    const created = await this.storeRepo.createForCurrentTenant({
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl,
      coverImageUrl: input.coverImageUrl,
      floor: input.floor,
      phone: input.phone,
      isRestaurant: input.isRestaurant,
      isFeatured: input.isFeatured,
      status: input.status,
      sortOrder: input.sortOrder,
      categoryIds,
    });

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);

    return serializeStore({
      id: created.id,
      tenantId: created.tenantId,
      name: created.name,
      slug: created.slug,
      logoUrl: created.logoUrl,
      coverImageUrl: created.coverImageUrl,
      floor: created.floor,
      phone: created.phone,
      isRestaurant: created.isRestaurant,
      isFeatured: created.isFeatured,
      status: created.status,
      sortOrder: created.sortOrder,
    });
  }

  async updateAdmin(id: string, input: AdminStoreInput): Promise<StoreDetailResponse> {
    if (input.categoryIds && input.categoryIds.length > 0) {
      const count = await this.storeRepo.countCategoriesForCurrentTenant(input.categoryIds);
      if (count !== [...new Set(input.categoryIds)].length) {
        throw new InvalidStoreCategoriesError();
      }
    }

    const updated = await this.storeRepo.updateForCurrentTenant(id, {
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl,
      coverImageUrl: input.coverImageUrl,
      floor: input.floor,
      phone: input.phone,
      isRestaurant: input.isRestaurant,
      isFeatured: input.isFeatured,
      status: input.status,
      sortOrder: input.sortOrder,
      categoryIds: input.categoryIds,
    });

    if (!updated) {
      throw new StoreNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);

    return serializeStore({
      id: updated.id,
      tenantId: updated.tenantId,
      name: updated.name,
      slug: updated.slug,
      logoUrl: updated.logoUrl,
      coverImageUrl: updated.coverImageUrl,
      floor: updated.floor,
      phone: updated.phone,
      isRestaurant: updated.isRestaurant,
      isFeatured: updated.isFeatured,
      status: updated.status,
      sortOrder: updated.sortOrder,
    });
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
