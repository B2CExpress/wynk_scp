import type { DataSource, Repository } from 'typeorm';
import { Category } from '../entities/Category';
import { withTenant } from '../utils/with-tenant';

export class StoreCategoryRepository {
  private readonly repo: Repository<Category>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Category);
  }

  async listForCurrentTenant(): Promise<Category[]> {
    return withTenant(this.repo.createQueryBuilder('category'))
      .orderBy('category.category_sort_order', 'ASC')
      .addOrderBy('category.category_name', 'ASC')
      .getMany();
  }

  async findByIdForCurrentTenant(id: string): Promise<Category | null> {
    return withTenant(this.repo.createQueryBuilder('category'))
      .andWhere('category.category_id = :id', { id })
      .getOne();
  }

  async findBySlugForCurrentTenant(slug: string): Promise<Category | null> {
    return withTenant(this.repo.createQueryBuilder('category'))
      .andWhere('category.category_slug = :slug', { slug })
      .getOne();
  }

  async createForCurrentTenant(input: {
    tenantId: string;
    name: string;
    slug: string;
    sortOrder: number;
  }): Promise<Category> {
    const category = this.repo.create({
      tenantId: input.tenantId,
      name: input.name,
      slug: input.slug,
      sortOrder: input.sortOrder,
    });

    return this.repo.save(category);
  }

  async updateForCurrentTenant(
    existing: Category,
    input: { name?: string; slug?: string; sortOrder?: number },
  ): Promise<Category> {
    if (input.name !== undefined) existing.name = input.name;
    if (input.slug !== undefined) existing.slug = input.slug;
    if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;

    return this.repo.save(existing);
  }

  async deleteByIdForCurrentTenant(id: string): Promise<boolean> {
    const existing = await this.findByIdForCurrentTenant(id);
    if (!existing) {
      return false;
    }

    await this.repo.delete(existing.id);
    return true;
  }

  async reorderForCurrentTenant(
    items: Array<{ id: string; sortOrder: number }>,
  ): Promise<Category[]> {
    const ids = items.map((item) => item.id);
    const categories = await withTenant(this.repo.createQueryBuilder('category'))
      .andWhere('category.category_id IN (:...ids)', { ids })
      .getMany();

    const byId = new Map(categories.map((category) => [category.id, category]));
    items.forEach((item) => {
      const category = byId.get(item.id);
      if (category) {
        category.sortOrder = item.sortOrder;
      }
    });

    await this.repo.save(categories);
    return this.listForCurrentTenant();
  }

  async findMaxSortOrderForCurrentTenant(): Promise<number> {
    const row = await withTenant(this.repo.createQueryBuilder('category'))
      .select('COALESCE(MAX(category.category_sort_order), 0)', 'maxSortOrder')
      .getRawOne<{ maxSortOrder: string }>();

    return Number(row?.maxSortOrder ?? 0);
  }
}
