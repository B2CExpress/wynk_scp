import type Redis from 'ioredis';
import type { Category } from '../entities/Category';
import { sanitizeStoreDescription } from '../lib/sanitize';
import { slugifyStoreName } from '../lib/slug';
import { uploadStoreImage } from '../lib/storage';
import { validateCreateStore, validateStoreInput, type UploadStubInput } from '../lib/validators';
import { requireTenantContext } from '../middleware/tenant-context';
import type { StoreRepository } from '../repositories/store.repository';
import type { StoreListQuery, StoreListResponse } from '../dtos/store-list.dto';
import { cached, invalidateByPattern } from '../utils/cache';

const CACHE_TTL_SECONDS = 300;

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

export interface PublicStoreDetailResponse extends StoreDetailResponse {
  description: string | null;
  externalUrl: string | null;
  openingHours: Record<string, unknown> | null;
  categories: StoreCategoryResponse[];
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

function hasOwn(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCategory(category: Category): StoreCategoryResponse {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
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
  return {
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
  };
}

function sanitizeDescription(description: string | null | undefined): string | null | undefined {
  if (description === undefined || description === null) {
    return description;
  }

  return sanitizeStoreDescription(description);
}

function buildCacheKey(tenantId: string, query: StoreListQuery): string {
  return `stores:list:${tenantId}:cat=${query.category ?? '-'}:feat=${
    query.featured === undefined ? '-' : String(query.featured)
  }:l=${query.limit}:p=${query.page}:q=${query.search ?? '-'}:rest=${
    query.isRestaurant === undefined ? '-' : String(query.isRestaurant)
  }`;
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

  async getActiveBySlug(slug: string): Promise<PublicStoreDetailResponse> {
    const store = await this.storeRepo.findActiveBySlugWithCategories(slug);
    if (!store) {
      throw new StoreNotFoundError();
    }

    return {
      ...buildStoreSummary(store),
      description: store.description,
      externalUrl: store.externalUrl,
      openingHours: (store.openingHours as Record<string, unknown> | null) ?? null,
      categories: store.categories.map(mapCategory),
    };
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
      const uploaded = await this.resolveUploadedImages(
        desiredSlug,
        validation.data.logo_upload ?? null,
        validation.data.cover_upload ?? null,
      );
      const created = await this.storeRepo.createForCurrentTenant({
        name: validation.data.name,
        slug: desiredSlug,
        description: sanitizeDescription(validation.data.description),
        logoUrl: uploaded.logoUrl ?? validation.data.logo_url,
        coverImageUrl: uploaded.coverImageUrl ?? validation.data.cover_image_url,
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

      return this.serializeAdminDetail(hydrated);
    } catch (error) {
      if (this.isSlugConflictError(error)) {
        throw new StoreSlugConflictError(desiredSlug);
      }
      throw error;
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
      const uploaded = await this.resolveUploadedImages(
        desiredSlug,
        validation.data.logo_upload ?? null,
        validation.data.cover_upload ?? null,
      );
      const updated = await this.storeRepo.updateForCurrentTenant(id, {
        name: validation.data.name,
        slug: slugWasProvided ? desiredSlug : undefined,
        description: sanitizeDescription(validation.data.description),
        logoUrl:
          uploaded.logoUrl ??
          (validation.data.logo_url === undefined ? undefined : validation.data.logo_url),
        coverImageUrl:
          uploaded.coverImageUrl ??
          (validation.data.cover_image_url === undefined
            ? undefined
            : validation.data.cover_image_url),
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

      return this.serializeAdminDetail(hydrated);
    } catch (error) {
      if (this.isSlugConflictError(error)) {
        throw new StoreSlugConflictError(desiredSlug);
      }
      throw error;
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
      data: stores.map((store) => ({
        ...buildStoreSummary(store),
        categories: (categoriesByStoreId.get(store.id) ?? []).map(mapCategory),
      })),
      total,
      page: query.page,
      limit: Math.min(query.limit, 100),
    };
  }

  async getDetailAdmin(id: string): Promise<AdminStoreDetailResponse> {
    const store = await this.storeRepo.findByIdWithCategoriesAdmin(id);
    if (!store) {
      throw new StoreNotFoundError();
    }

    return this.serializeAdminDetail(store);
  }

  async deleteAdmin(id: string): Promise<void> {
    const deleted = await this.storeRepo.deleteByIdForCurrentTenant(id);
    if (!deleted) {
      throw new StoreNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);
  }

  async invalidateListings(tenantId: string): Promise<void> {
    await invalidateByPattern(this.redis, `stores:list:${tenantId}:*`);
  }

  private serializeAdminDetail(store: StoreDetailResponse & {
    description: string | null;
    externalUrl: string | null;
    openingHours: Record<string, unknown> | null;
    categories: Category[];
  }): AdminStoreDetailResponse {
    return {
      ...buildStoreSummary(store),
      description: store.description,
      externalUrl: store.externalUrl,
      openingHours: store.openingHours,
      categories: store.categories.map(mapCategory),
    };
  }

  private buildSlug(name: string, requestedSlug?: string): string {
    const slug = requestedSlug ?? slugifyStoreName(name);
    if (!slug) {
      throw new StoreValidationError({
        slug: 'slug could not be generated from name',
      });
    }

    return slug;
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

  private async resolveUploadedImages(
    storeSlug: string,
    logoUpload: UploadStubInput | null,
    coverUpload: UploadStubInput | null,
  ): Promise<{ logoUrl: string | null; coverImageUrl: string | null }> {
    const { tenantId } = requireTenantContext();

    const logoUrl = logoUpload
      ? await uploadStoreImage(
          {
            fieldname: 'logo_upload',
            originalname: logoUpload.file_name,
            encoding: '7bit',
            mimetype: logoUpload.mime_type ?? 'application/octet-stream',
            buffer: Buffer.alloc(0),
            size: logoUpload.size ?? 0,
          },
          tenantId,
          storeSlug,
        )
      : null;

    const coverImageUrl = coverUpload
      ? await uploadStoreImage(
          {
            fieldname: 'cover_upload',
            originalname: coverUpload.file_name,
            encoding: '7bit',
            mimetype: coverUpload.mime_type ?? 'application/octet-stream',
            buffer: Buffer.alloc(0),
            size: coverUpload.size ?? 0,
          },
          tenantId,
          storeSlug,
        )
      : null;

    return { logoUrl, coverImageUrl };
  }

  private isSlugConflictError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const driverError = (error as { driverError?: { code?: string; constraint?: string } })
      .driverError;

    return driverError?.code === '23505' && driverError.constraint === 'uq_tb_store_tenant_slug';
  }
}
