import type { DataSource, Repository } from 'typeorm';
import { Store } from '../entities/Store';
import { Category } from '../entities/Category';
import { StoreCategory } from '../entities/StoreCategory';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';
import type { StoreListQuery, StoreListItem } from '../dtos/store-list.dto';

const ACTIVE_STATUS = 'active';
export class StoreRepository {
  private readonly storeRepo: Repository<Store>;

  constructor(dataSource: DataSource) {
    this.storeRepo = dataSource.getRepository(Store);
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
}
