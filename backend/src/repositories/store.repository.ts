import { In, type DataSource, type Repository } from 'typeorm';
import { Store } from '../entities/Store';
import { Category } from '../entities/Category';
import { StoreCategory } from '../entities/StoreCategory';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';
import type { StoreListQuery, StoreListItem } from '../dtos/store-list.dto';

const ACTIVE_STATUS = 'active';
export class StoreRepository {
  private readonly dataSource: DataSource;
  private readonly storeRepo: Repository<Store>;
  private readonly categoryRepo: Repository<Category>;
  private readonly storeCategoryRepo: Repository<StoreCategory>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.storeRepo = dataSource.getRepository(Store);
    this.categoryRepo = dataSource.getRepository(Category);
    this.storeCategoryRepo = dataSource.getRepository(StoreCategory);
  }

  async findActiveListing(
    query: StoreListQuery,
  ): Promise<{ items: StoreListItem[]; total: number }> {
    const ctx = requireTenantContext();
    const offset = (query.page - 1) * query.limit;

    let qb = withTenant(this.storeRepo.createQueryBuilder('store')).andWhere(
      'store.store_status = :status',
      { status: ACTIVE_STATUS },
    );

    if (query.featured !== undefined) {
      qb = qb.andWhere('store.store_is_featured = :featured', { featured: query.featured });
    }

    if (query.isRestaurant !== undefined) {
      qb = qb.andWhere('store.store_is_restaurant = :isRestaurant', {
        isRestaurant: query.isRestaurant,
      });
    }

    if (query.search) {
      qb = qb
        .andWhere(`store.store_search_vector @@ plainto_tsquery('portuguese', :search)`, {
          search: query.search,
        })
        .addOrderBy(
          `ts_rank(store.store_search_vector, plainto_tsquery('portuguese', :search))`,
          'DESC',
        );
    }

    if (query.category) {
      // JOIN com tb_store_category + tb_category, filtrando por slug e
      // sempre incluindo tenant_id no join pra defesa em profundidade.
      qb = qb
        .innerJoin(
          StoreCategory,
          'sc',
          'sc.store_id = store.store_id AND sc.tenant_id = :tenantId',
          { tenantId: ctx.tenantId },
        )
        .innerJoin(
          Category,
          'cat',
          'cat.category_id = sc.category_id AND cat.tenant_id = :tenantId AND cat.category_slug = :categorySlug',
          { tenantId: ctx.tenantId, categorySlug: query.category },
        );
    }

    qb = qb
      .orderBy('store.store_is_featured', 'DESC')
      .addOrderBy('store.store_sort_order', 'ASC')
      .addOrderBy('store.store_name', 'ASC')
      .take(query.limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        slug: s.slug,
        logoUrl: s.logoUrl,
        coverImageUrl: s.coverImageUrl,
        floor: s.floor,
        phone: s.phone,
        isRestaurant: s.isRestaurant,
        isFeatured: s.isFeatured,
        sortOrder: s.sortOrder,
      })),
      total,
    };
  }

  async findActiveBySlug(slug: string): Promise<Store | null> {
    return withTenant(this.storeRepo.createQueryBuilder('store'))
      .andWhere('store.store_status = :status', { status: ACTIVE_STATUS })
      .andWhere('store.store_slug = :slug', { slug })
      .getOne();
  }

  async findByIdForCurrentTenant(id: string): Promise<Store | null> {
    return withTenant(this.storeRepo.createQueryBuilder('store'))
      .andWhere('store.store_id = :id', { id })
      .getOne();
  }

  async findBySlugForCurrentTenant(slug: string): Promise<Store | null> {
    return withTenant(this.storeRepo.createQueryBuilder('store'))
      .andWhere('store.store_slug = :slug', { slug })
      .getOne();
  }

  async countCategoriesForCurrentTenant(categoryIds: string[]): Promise<number> {
    const { tenantId } = requireTenantContext();
    const uniqueIds = [...new Set(categoryIds)];
    if (uniqueIds.length === 0) {
      return 0;
    }

    return this.categoryRepo.count({
      where: {
        tenantId,
        id: In(uniqueIds),
      },
    });
  }

  async createForCurrentTenant(input: {
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    externalUrl?: string | null;
    floor?: string | null;
    phone?: string | null;
    openingHours?: Record<string, any> | null;
    isRestaurant?: boolean;
    isFeatured?: boolean;
    status?: string;
    sortOrder?: number;
    categoryIds?: string[];
  }): Promise<Store> {
    const { tenantId } = requireTenantContext();
    const uniqueCategoryIds = [...new Set(input.categoryIds ?? [])];

    return this.dataSource.transaction(async (manager) => {
      const storeRepo = manager.getRepository(Store);
      const relationRepo = manager.getRepository(StoreCategory);

      const store = storeRepo.create({
        tenantId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        logoUrl: input.logoUrl ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        externalUrl: input.externalUrl ?? null,
        floor: input.floor ?? null,
        phone: input.phone ?? null,
        openingHours: input.openingHours ?? null,
        isRestaurant: input.isRestaurant ?? false,
        isFeatured: input.isFeatured ?? false,
        status: input.status ?? ACTIVE_STATUS,
        sortOrder: input.sortOrder ?? 0,
      });

      const created = await storeRepo.save(store);

      if (uniqueCategoryIds.length > 0) {
        const relations = uniqueCategoryIds.map((categoryId) =>
          relationRepo.create({
            storeId: created.id,
            categoryId,
            tenantId,
          }),
        );
        await relationRepo.save(relations);
      }

      return created;
    });
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      name?: string;
      slug?: string;
      description?: string | null;
      logoUrl?: string | null;
      coverImageUrl?: string | null;
      externalUrl?: string | null;
      floor?: string | null;
      phone?: string | null;
      openingHours?: Record<string, any> | null;
      isRestaurant?: boolean;
      isFeatured?: boolean;
      status?: string;
      sortOrder?: number;
      categoryIds?: string[];
    },
  ): Promise<Store | null> {
    const { tenantId } = requireTenantContext();
    const existing = await this.findByIdForCurrentTenant(id);
    if (!existing) {
      return null;
    }

    const uniqueCategoryIds = input.categoryIds ? [...new Set(input.categoryIds)] : undefined;

    return this.dataSource.transaction(async (manager) => {
      const storeRepo = manager.getRepository(Store);
      const relationRepo = manager.getRepository(StoreCategory);

      if (input.name !== undefined) existing.name = input.name;
      if (input.slug !== undefined) existing.slug = input.slug;
      if (input.description !== undefined) existing.description = input.description;
      if (input.logoUrl !== undefined) existing.logoUrl = input.logoUrl;
      if (input.coverImageUrl !== undefined) existing.coverImageUrl = input.coverImageUrl;
      if (input.externalUrl !== undefined) existing.externalUrl = input.externalUrl;
      if (input.floor !== undefined) existing.floor = input.floor;
      if (input.phone !== undefined) existing.phone = input.phone;
      if (input.openingHours !== undefined) existing.openingHours = input.openingHours;
      if (input.isRestaurant !== undefined) existing.isRestaurant = input.isRestaurant;
      if (input.isFeatured !== undefined) existing.isFeatured = input.isFeatured;
      if (input.status !== undefined) existing.status = input.status;
      if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;

      const saved = await storeRepo.save(existing);

      if (uniqueCategoryIds !== undefined) {
        await relationRepo.delete({ storeId: saved.id, tenantId });
        if (uniqueCategoryIds.length > 0) {
          const relations = uniqueCategoryIds.map((categoryId) =>
            relationRepo.create({
              storeId: saved.id,
              categoryId,
              tenantId,
            }),
          );
          await relationRepo.save(relations);
        }
      }

      return saved;
    });
  }

  async listAdminWithFilters(query: {
    page: number;
    limit: number;
    status?: string;
    featured?: boolean;
    search?: string;
  }): Promise<{ stores: Store[]; total: number; categoriesByStoreId: Map<string, Category[]> }> {
    const offset = (query.page - 1) * query.limit;
    const clamped = Math.min(query.limit, 100); // max 100 per page

    let qb = withTenant(this.storeRepo.createQueryBuilder('store'));

    if (query.status) {
      qb = qb.andWhere('store.store_status = :status', { status: query.status });
    }

    if (query.featured !== undefined) {
      qb = qb.andWhere('store.store_is_featured = :featured', { featured: query.featured });
    }

    if (query.search) {
      // Escape inline de wildcards LIKE/ILIKE (`%`, `_`, `\`) no admin —
      // a versão pública usa fulltext (tsvector); aqui mantemos ILIKE simples
      // por agora pra preservar o comportamento do SPEC-1430.
      const escaped = query.search.replace(/[\\%_]/g, '\\$&');
      qb = qb.andWhere('store.store_name ILIKE :search', { search: `%${escaped}%` });
    }

    qb = qb
      .orderBy('store.store_is_featured', 'DESC')
      .addOrderBy('store.store_sort_order', 'ASC')
      .addOrderBy('store.store_name', 'ASC')
      .take(clamped)
      .skip(offset);

    const [stores, total] = await qb.getManyAndCount();
    const categoriesByStoreId = await this.findCategoriesByStoreIdsForCurrentTenant(
      stores.map((store) => store.id),
    );
    return { stores, total, categoriesByStoreId };
  }

  async findByIdWithCategoriesAdmin(
    id: string,
  ): Promise<(Store & { categories: Category[] }) | null> {
    const store = await this.findByIdForCurrentTenant(id);
    if (!store) {
      return null;
    }

    const categoriesByStoreId = await this.findCategoriesByStoreIdsForCurrentTenant([id]);
    const categories = categoriesByStoreId.get(id) ?? [];

    return {
      ...store,
      categories,
    };
  }

  async deleteByIdForCurrentTenant(id: string): Promise<boolean> {
    const { tenantId } = requireTenantContext();
    const existing = await this.findByIdForCurrentTenant(id);
    if (!existing) {
      return false;
    }

    return this.dataSource.transaction(async (manager) => {
      const relationRepo = manager.getRepository(StoreCategory);
      const storeRepo = manager.getRepository(Store);

      // Delete relations first (foreign key constraint)
      await relationRepo.delete({ storeId: id, tenantId });

      // Then delete the store
      await storeRepo.delete({ id, tenantId });

      return true;
    });
  }

  private async findCategoriesByStoreIdsForCurrentTenant(
    storeIds: string[],
  ): Promise<Map<string, Category[]>> {
    const uniqueStoreIds = [...new Set(storeIds)];
    const grouped = new Map<string, Category[]>();

    uniqueStoreIds.forEach((storeId) => grouped.set(storeId, []));
    if (uniqueStoreIds.length === 0) {
      return grouped;
    }

    const { tenantId } = requireTenantContext();
    const relations = await this.storeCategoryRepo.find({
      where: {
        storeId: In(uniqueStoreIds),
        tenantId,
      },
    });

    const uniqueCategoryIds = [...new Set(relations.map((relation) => relation.categoryId))];
    if (uniqueCategoryIds.length === 0) {
      return grouped;
    }

    const categories = await this.categoryRepo.find({
      where: {
        id: In(uniqueCategoryIds),
        tenantId,
      },
    });
    const categoriesById = new Map(categories.map((category) => [category.id, category]));

    relations.forEach((relation) => {
      const category = categoriesById.get(relation.categoryId);
      if (!category) {
        return;
      }

      grouped.get(relation.storeId)?.push(category);
    });

    return grouped;
  }
}
