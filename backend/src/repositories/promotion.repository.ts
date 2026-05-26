import type { DataSource, Repository } from 'typeorm';
import { Promotion } from '../entities/Promotion';
import { Store } from '../entities/Store';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export interface ListPromotionsQuery {
  page?: number;
  limit?: number;
  status?: string;
  store_id?: string;
  expired?: boolean;
}

export interface PromotionWithStore extends Promotion {
  store?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ListPromotionsResult {
  promotions: PromotionWithStore[];
  total: number;
}

export class PromotionRepository {
  private readonly dataSource: DataSource;
  private readonly promotionRepo: Repository<Promotion>;
  private readonly storeRepo: Repository<Store>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.promotionRepo = dataSource.getRepository(Promotion);
    this.storeRepo = dataSource.getRepository(Store);
  }

  async findByIdForCurrentTenant(id: string): Promise<Promotion | null> {
    return withTenant(this.promotionRepo.createQueryBuilder('promotion'))
      .andWhere('promotion.promotion_id = :id', { id })
      .getOne();
  }

  async findBySlugForCurrentTenant(slug: string): Promise<Promotion | null> {
    return withTenant(this.promotionRepo.createQueryBuilder('promotion'))
      .andWhere('promotion.promotion_slug = :slug', { slug })
      .getOne();
  }

  async storeExistsForCurrentTenant(storeId: string): Promise<boolean> {
    const count = await withTenant(this.storeRepo.createQueryBuilder('store'))
      .andWhere('store.store_id = :storeId', { storeId })
      .getCount();
    return count > 0;
  }

  async createForCurrentTenant(input: {
    storeId: string;
    title: string;
    slug: string;
    description: string;
    imageUrl?: string | null;
    discountLabel: string;
    validFrom: Date;
    validUntil: Date;
  }): Promise<Promotion> {
    const { tenantId } = requireTenantContext();

    const promotion = this.promotionRepo.create({
      tenantId,
      storeId: input.storeId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      imageUrl: input.imageUrl ?? null,
      discountLabel: input.discountLabel,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      status: 'draft',
    });

    return this.promotionRepo.save(promotion);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      storeId?: string;
      title?: string;
      slug?: string;
      description?: string;
      imageUrl?: string | null;
      discountLabel?: string;
      validFrom?: Date;
      validUntil?: Date;
    },
  ): Promise<Promotion | null> {
    const promotion = await this.findByIdForCurrentTenant(id);
    if (!promotion) {
      return null;
    }

    if (input.storeId !== undefined) promotion.storeId = input.storeId;
    if (input.title !== undefined) promotion.title = input.title;
    if (input.slug !== undefined) promotion.slug = input.slug;
    if (input.description !== undefined) promotion.description = input.description;
    if (input.imageUrl !== undefined) promotion.imageUrl = input.imageUrl;
    if (input.discountLabel !== undefined) promotion.discountLabel = input.discountLabel;
    if (input.validFrom !== undefined) promotion.validFrom = input.validFrom;
    if (input.validUntil !== undefined) promotion.validUntil = input.validUntil;

    return this.promotionRepo.save(promotion);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const promotion = await this.findByIdForCurrentTenant(id);
    if (!promotion) {
      return false;
    }

    // Only allow delete if draft or archived
    if (promotion.status !== 'draft' && promotion.status !== 'archived') {
      return false;
    }

    await this.promotionRepo.remove(promotion);
    return true;
  }

  async publishForCurrentTenant(id: string): Promise<Promotion | null> {
    const promotion = await this.findByIdForCurrentTenant(id);
    if (!promotion) {
      return null;
    }

    promotion.status = 'published';
    promotion.publishedAt = new Date();
    return this.promotionRepo.save(promotion);
  }

  async archiveForCurrentTenant(id: string): Promise<Promotion | null> {
    const promotion = await this.findByIdForCurrentTenant(id);
    if (!promotion) {
      return null;
    }

    promotion.status = 'archived';
    return this.promotionRepo.save(promotion);
  }

  async listForCurrentTenant(query: ListPromotionsQuery): Promise<ListPromotionsResult> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);
    const skip = (page - 1) * limit;

    let qb = withTenant(this.promotionRepo.createQueryBuilder('promotion'))
      .leftJoin(
        Store,
        'store',
        'store.store_id = promotion.store_id AND store.tenant_id = promotion.tenant_id',
      )
      .addSelect(['store.store_id', 'store.store_name', 'store.store_slug']);

    // Filter by status if provided
    if (query.status) {
      qb = qb.andWhere('promotion.promotion_status = :status', { status: query.status });
    }

    // Filter by store_id if provided
    if (query.store_id) {
      qb = qb.andWhere('promotion.store_id = :storeId', { storeId: query.store_id });
    }

    // Handle expired filter
    const now = new Date();
    if (query.expired === true) {
      // Show only expired promotions
      qb = qb.andWhere('promotion.promotion_valid_until < :now', { now });
    } else if (query.expired === false) {
      // Show only active promotions
      qb = qb.andWhere('promotion.promotion_valid_until >= :now', { now });
    }

    // Get total count before pagination
    const total = await qb.getCount();

    // Apply pagination
    const results = await qb
      .orderBy('promotion.promotion_created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    // Map to include store data in response
    const promotions: PromotionWithStore[] = results.entities.map((promo, idx) => {
      const raw = results.raw[idx];
      return {
        ...promo,
        store: raw.store_store_id
          ? {
              id: raw.store_store_id,
              name: raw.store_store_name,
              slug: raw.store_store_slug,
            }
          : undefined,
      };
    });

    return { promotions, total };
  }

  async listActiveForStore(storeId: string): Promise<Promotion[]> {
    const now = new Date();
    return withTenant(this.promotionRepo.createQueryBuilder('promotion'))
      .andWhere('promotion.store_id = :storeId', { storeId })
      .andWhere('promotion.promotion_status = :status', { status: 'published' })
      .andWhere('promotion.promotion_valid_from <= :now', { now })
      .andWhere('promotion.promotion_valid_until >= :now', { now })
      .orderBy('promotion.promotion_created_at', 'DESC')
      .getMany();
  }

  async findPublishedActiveForCurrentTenant(limit: number = 200): Promise<Promotion[]> {
    const now = new Date();
    return withTenant(this.promotionRepo.createQueryBuilder('promotion'))
      .andWhere('promotion.promotion_status = :status', { status: 'published' })
      .andWhere('promotion.promotion_valid_from <= :now', { now })
      .andWhere('promotion.promotion_valid_until >= :now', { now })
      .orderBy('promotion.promotion_updated_at', 'DESC')
      .limit(limit)
      .getMany();
  }
}
