import type Redis from 'ioredis';
import type {
  PromotionRepository,
  ListPromotionsQuery,
} from '../repositories/promotion.repository';
import type { Promotion } from '../entities/Promotion';
import { requireTenantContext } from '../middleware/tenant-context';
import { invalidateByPattern } from '../utils/cache';
import type { CreatePromotionInput, UpdatePromotionInput } from '../dtos/promotion.dto';

export interface PromotionDetailResponse {
  id: string;
  tenantId: string;
  storeId: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  discountLabel: string;
  validFrom: Date;
  validUntil: Date;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPromotionsResponse {
  data: Array<
    PromotionDetailResponse & {
      store?: {
        id: string;
        name: string;
        slug: string;
      };
    }
  >;
  total: number;
}

export class PromotionNotFoundError extends Error {
  constructor() {
    super('promotion_not_found');
  }
}

export class StoreNotFoundError extends Error {
  constructor() {
    super('store_not_found');
  }
}

export class SlugConflictError extends Error {
  constructor() {
    super('slug_conflict');
  }
}

export class CannotDeleteError extends Error {
  constructor() {
    super('cannot_delete');
  }
}

function serializePromotion(promotion: Promotion): PromotionDetailResponse {
  return {
    id: promotion.id,
    tenantId: promotion.tenantId,
    storeId: promotion.storeId,
    title: promotion.title,
    slug: promotion.slug,
    description: promotion.description,
    imageUrl: promotion.imageUrl,
    discountLabel: promotion.discountLabel,
    validFrom: promotion.validFrom,
    validUntil: promotion.validUntil,
    status: promotion.status,
    publishedAt: promotion.publishedAt,
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 250);
}

export class PromotionService {
  constructor(
    private readonly promotionRepo: PromotionRepository,
    private readonly redis: Redis,
  ) {}

  async getByIdForCurrentTenant(id: string): Promise<PromotionDetailResponse> {
    const promotion = await this.promotionRepo.findByIdForCurrentTenant(id);
    if (!promotion) {
      throw new PromotionNotFoundError();
    }

    return serializePromotion(promotion);
  }

  async createForCurrentTenant(input: CreatePromotionInput): Promise<PromotionDetailResponse> {
    if (
      !input.store_id ||
      !input.title ||
      !input.description ||
      !input.discount_label ||
      !input.valid_from ||
      !input.valid_until
    ) {
      throw new Error('invalid_request');
    }

    // Validate store exists and belongs to current tenant
    const storeExists = await this.promotionRepo.storeExistsForCurrentTenant(input.store_id);
    if (!storeExists) {
      throw new StoreNotFoundError();
    }

    // Parse dates
    const validFrom = new Date(input.valid_from);
    const validUntil = new Date(input.valid_until);

    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
      throw new Error('invalid_request');
    }

    if (validUntil <= validFrom) {
      throw new Error('invalid_request');
    }

    // Generate slug if not provided
    const slug = input.slug || generateSlug(input.title);

    // Check for slug conflict
    const existingPromotion = await this.promotionRepo.findBySlugForCurrentTenant(slug);
    if (existingPromotion) {
      throw new SlugConflictError();
    }

    try {
      const created = await this.promotionRepo.createForCurrentTenant({
        storeId: input.store_id,
        title: input.title,
        slug,
        description: input.description,
        imageUrl: input.image_url,
        discountLabel: input.discount_label,
        validFrom,
        validUntil,
      });

      const { tenantId } = requireTenantContext();
      await this.invalidateListings(tenantId, input.store_id);

      return serializePromotion(created);
    } catch (err) {
      // Handle unique constraint violation on slug
      if (err instanceof Error && err.message.includes('uq_tb_promotion_tenant_slug')) {
        throw new SlugConflictError();
      }
      throw err;
    }
  }

  async updateForCurrentTenant(
    id: string,
    input: UpdatePromotionInput,
  ): Promise<PromotionDetailResponse> {
    const promotion = await this.promotionRepo.findByIdForCurrentTenant(id);
    if (!promotion) {
      throw new PromotionNotFoundError();
    }

    // If store_id is being changed, validate it exists for current tenant
    if (input.store_id && input.store_id !== promotion.storeId) {
      const storeExists = await this.promotionRepo.storeExistsForCurrentTenant(input.store_id);
      if (!storeExists) {
        throw new StoreNotFoundError();
      }
    }

    const validFrom = input.valid_from ? new Date(input.valid_from) : promotion.validFrom;
    const validUntil = input.valid_until ? new Date(input.valid_until) : promotion.validUntil;

    if (validUntil <= validFrom) {
      throw new Error('invalid_request');
    }

    // If slug is being changed, check for conflict
    const newSlug = input.slug || (input.title ? generateSlug(input.title) : undefined);
    if (newSlug && newSlug !== promotion.slug) {
      const existingPromotion = await this.promotionRepo.findBySlugForCurrentTenant(newSlug);
      if (existingPromotion) {
        throw new SlugConflictError();
      }
    }

    try {
      const updated = await this.promotionRepo.updateForCurrentTenant(id, {
        storeId: input.store_id,
        title: input.title,
        slug: newSlug,
        description: input.description,
        imageUrl: input.image_url,
        discountLabel: input.discount_label,
        validFrom,
        validUntil,
      });

      if (!updated) {
        throw new PromotionNotFoundError();
      }

      const { tenantId } = requireTenantContext();
      await this.invalidateListings(tenantId, updated.storeId);

      return serializePromotion(updated);
    } catch (err) {
      if (err instanceof Error && err.message.includes('uq_tb_promotion_tenant_slug')) {
        throw new SlugConflictError();
      }
      throw err;
    }
  }

  async deleteForCurrentTenant(id: string): Promise<void> {
    const promotion = await this.promotionRepo.findByIdForCurrentTenant(id);
    if (!promotion) {
      throw new PromotionNotFoundError();
    }

    const deleted = await this.promotionRepo.deleteForCurrentTenant(id);
    if (!deleted) {
      throw new CannotDeleteError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId, promotion.storeId);
  }

  async publishForCurrentTenant(id: string): Promise<PromotionDetailResponse> {
    const published = await this.promotionRepo.publishForCurrentTenant(id);
    if (!published) {
      throw new PromotionNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId, published.storeId);

    return serializePromotion(published);
  }

  async archiveForCurrentTenant(id: string): Promise<PromotionDetailResponse> {
    const archived = await this.promotionRepo.archiveForCurrentTenant(id);
    if (!archived) {
      throw new PromotionNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId, archived.storeId);

    return serializePromotion(archived);
  }

  async listForCurrentTenant(query: ListPromotionsQuery): Promise<ListPromotionsResponse> {
    const result = await this.promotionRepo.listForCurrentTenant(query);

    return {
      data: result.promotions.map((promo) => ({
        ...serializePromotion(promo),
        store: promo.store,
      })),
      total: result.total,
    };
  }

  async listPublishedActiveForCurrentTenant(
    limit: number = 200,
  ): Promise<PromotionDetailResponse[]> {
    const promotions = await this.promotionRepo.findPublishedActiveForCurrentTenant(limit);
    return promotions.map((p) => serializePromotion(p));
  }

  private async invalidateListings(tenantId: string, storeId?: string): Promise<void> {
    await invalidateByPattern(this.redis, `promotions:detail:${tenantId}:*`);
    await invalidateByPattern(this.redis, `promotions:list:${tenantId}:*`);
    if (storeId) {
      await invalidateByPattern(this.redis, `stores:detail:${tenantId}:${storeId}:*`);
      await invalidateByPattern(this.redis, `stores:list:${tenantId}:*`);
    }
  }
}
