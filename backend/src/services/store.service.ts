import type Redis from 'ioredis';
import type { StoreRepository } from '../repositories/store.repository';
import { requireTenantContext } from '../middleware/tenant-context';
import { cached, invalidateByPattern } from '../utils/cache';
import type { StoreListQuery, StoreListResponse } from '../dtos/store-list.dto';
import type { Category } from '../entities/Category';
import { sanitizeStoreDescription } from '../lib/sanitize';
import { slugifyStoreName } from '../lib/slug';
import { validateCreateStore, validateStoreInput } from '../lib/validators';

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

export interface StoreCategoryResponse {
  id: string;
  name: string;
  slug: string;
}

export interface AdminStoreListItemResponse extends StoreDetailResponse {
  categories: StoreCategoryResponse[];
}

export interface AdminStoreDetailResponse extends AdminStoreListItemResponse {
  description: string | null;
  externalUrl: string | null;
  openingHours: Record<string, unknown> | null;
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

export class StoreValidationError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    super('store_validation_error');
  }
}

export class StoreSlugConflictError extends Error {
  constructor(public readonly slug: string) {
    super('store_slug_conflict');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function mapCategory(category: Category): StoreCategoryResponse {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
  };
}

function serializeStore(store: StoreDetailResponse): StoreDetailResponse {
  return store;
}

function serializeAdminListItem(
  store: StoreDetailResponse,
  categories: Category[],
): AdminStoreListItemResponse {
  return {
    ...serializeStore(store),
    categories: categories.map(mapCategory),
  };
}

function serializeAdminDetail(
  store: StoreDetailResponse & {
    description: string | null;
    externalUrl: string | null;
    openingHours: Record<string, unknown> | null;
    categories: Category[];
  },
): AdminStoreDetailResponse {
  return {
    ...serializeAdminListItem(store, store.categories),
    description: store.description,
    externalUrl: store.externalUrl,
    openingHours: store.openingHours,
  };
}

function buildStoreSummary(store: {
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
}): StoreDetailResponse {
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

function sanitizeDescription(description: string | null | undefined): string | null | undefined {
  if (description === undefined || description === null) {
    return description;
  }

  return sanitizeStoreDescription(description);
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

    return buildStoreSummary(store);
  }

  async createAdmin(input: unknown): Promise<AdminStoreDetailResponse> {
    const validation = validateCreateStore(input);
    if (!validation.success) {
      throw new StoreValidationError(validation.errors);
    }

    const desiredSlug = this.buildSlug(validation.data.name, validation.data.slug ?? undefined);
    await this.assertSlugAvailable(desiredSlug);

    const categoryIds = validation.data.category_ids ?? [];
    await this.assertValidCategories(categoryIds);

    try {
      const created = await this.storeRepo.createForCurrentTenant({
        name: validation.data.name,
        slug: desiredSlug,
        description: sanitizeDescription(validation.data.description),
        logoUrl: validation.data.logo_url,
        coverImageUrl: validation.data.cover_image_url,
        externalUrl: validation.data.external_url,
        floor: validation.data.floor,
        phone: validation.data.phone,
        openingHours: validation.data.opening_hours ?? null,
        isRestaurant: validation.data.is_restaurant,
        isFeatured: validation.data.is_featured,
        status: validation.data.status,
        sortOrder: validation.data.sort_order,
        categoryIds,
      });

      const hydrated = await this.storeRepo.findByIdWithCategoriesAdmin(created.id);
      if (!hydrated) {
        throw new StoreNotFoundError();
      }

      const { tenantId } = requireTenantContext();
      await this.invalidateListings(tenantId);

      return serializeAdminDetail({
        ...buildStoreSummary(hydrated),
        description: hydrated.description,
        externalUrl: hydrated.externalUrl,
        openingHours: (hydrated.openingHours as Record<string, unknown> | null) ?? null,
        categories: hydrated.categories,
      });
    } catch (err) {
      if (this.isSlugConflictError(err)) {
        throw new StoreSlugConflictError(desiredSlug);
      }
      throw err;
    }
  }

  async updateAdmin(id: string, input: unknown): Promise<AdminStoreDetailResponse> {
    const existing = await this.storeRepo.findByIdForCurrentTenant(id);
    if (!existing) {
      throw new StoreNotFoundError();
    }

    const raw = isRecord(input) ? input : {};
    const validation = validateStoreInput(input);
    if (!validation.success) {
      throw new StoreValidationError(validation.errors);
    }

    const slugWasProvided = hasOwn(raw, 'slug');
    const categoryIdsWereProvided = hasOwn(raw, 'category_ids');
    const desiredSlug = slugWasProvided
      ? this.buildSlug(validation.data.name ?? existing.name, validation.data.slug ?? undefined)
      : existing.slug;

    if (slugWasProvided && desiredSlug !== existing.slug) {
      await this.assertSlugAvailable(desiredSlug, existing.id);
    }

    if (categoryIdsWereProvided) {
      await this.assertValidCategories(validation.data.category_ids ?? []);
    }

    try {
      const updated = await this.storeRepo.updateForCurrentTenant(id, {
        name: validation.data.name,
        slug: slugWasProvided ? desiredSlug : undefined,
        description: sanitizeDescription(validation.data.description),
        logoUrl: validation.data.logo_url,
        coverImageUrl: validation.data.cover_image_url,
        externalUrl: validation.data.external_url,
        floor: validation.data.floor,
        phone: validation.data.phone,
        openingHours:
          validation.data.opening_hours === undefined
            ? undefined
            : (validation.data.opening_hours ?? null),
        isRestaurant: validation.data.is_restaurant,
        isFeatured: validation.data.is_featured,
        status: validation.data.status,
        sortOrder: validation.data.sort_order,
        categoryIds: categoryIdsWereProvided ? (validation.data.category_ids ?? []) : undefined,
      });

      if (!updated) {
        throw new StoreNotFoundError();
      }

      const hydrated = await this.storeRepo.findByIdWithCategoriesAdmin(updated.id);
      if (!hydrated) {
        throw new StoreNotFoundError();
      }

      const { tenantId } = requireTenantContext();
      await this.invalidateListings(tenantId);

      return serializeAdminDetail({
        ...buildStoreSummary(hydrated),
        description: hydrated.description,
        externalUrl: hydrated.externalUrl,
        openingHours: (hydrated.openingHours as Record<string, unknown> | null) ?? null,
        categories: hydrated.categories,
      });
    } catch (err) {
      if (this.isSlugConflictError(err)) {
        throw new StoreSlugConflictError(desiredSlug);
      }
      throw err;
    }
  }

  async listAdminWithFilters(query: {
    page: number;
    limit: number;
    status?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ data: AdminStoreListItemResponse[]; total: number; page: number; limit: number }> {
    const { stores, total, categoriesByStoreId } = await this.storeRepo.listAdminWithFilters(query);

    return {
      data: stores.map((store) =>
        serializeAdminListItem(
          buildStoreSummary(store),
          categoriesByStoreId.get(store.id) ?? [],
        ),
      ),
      total,
      page: query.page,
      limit: Math.min(query.limit, 100),
    };
  }

  /**
   * Invalida todo cache de listagem do tenant atual. Caller futuro:
   * endpoints admin de stores/categories (POST/PUT/DELETE) — chegam em
   * SPEC futura. TTL de 5 min cobre o gap até lá.
   */
  async invalidateListings(tenantId: string): Promise<void> {
    await invalidateByPattern(this.redis, `stores:list:${tenantId}:*`);
  }

  async getDetailAdmin(id: string): Promise<AdminStoreDetailResponse> {
    const storeWithCats = await this.storeRepo.findByIdWithCategoriesAdmin(id);
    if (!storeWithCats) {
      throw new StoreNotFoundError();
    }

    return serializeAdminDetail({
      ...buildStoreSummary(storeWithCats),
      description: storeWithCats.description,
      externalUrl: storeWithCats.externalUrl,
      openingHours: (storeWithCats.openingHours as Record<string, unknown> | null) ?? null,
      categories: storeWithCats.categories,
    });
  }

  async deleteAdmin(id: string): Promise<void> {
    const deleted = await this.storeRepo.deleteByIdForCurrentTenant(id);
    if (!deleted) {
      throw new StoreNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);
  }

  private buildSlug(name: string, requestedSlug?: string): string {
    const candidate = requestedSlug ?? slugifyStoreName(name);
    if (!candidate) {
      throw new StoreValidationError({
        slug: 'slug could not be generated from name',
      });
    }
    return candidate;
  }

  private async assertValidCategories(categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) {
      return;
    }

    const count = await this.storeRepo.countCategoriesForCurrentTenant(categoryIds);
    if (count !== [...new Set(categoryIds)].length) {
      throw new InvalidStoreCategoriesError();
    }
  }

  private async assertSlugAvailable(slug: string, ignoreStoreId?: string): Promise<void> {
    const existing = await this.storeRepo.findBySlugForCurrentTenant(slug);
    if (existing && existing.id !== ignoreStoreId) {
      throw new StoreSlugConflictError(slug);
    }
  }

  private isSlugConflictError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const driverError = (error as { driverError?: { code?: string; constraint?: string } })
      .driverError;

    return (
      driverError?.code === '23505' && driverError.constraint === 'uq_tb_store_tenant_slug'
    );
  }
}
