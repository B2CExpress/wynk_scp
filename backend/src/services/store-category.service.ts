import { slugifyStoreName } from '../lib/slug';
import {
  validateStoreCategoryInput,
  validateStoreCategoryReorder,
} from '../lib/validators';
import { requireTenantContext } from '../middleware/tenant-context';
import type { StoreCategoryRepository } from '../repositories/store-category.repository';

export interface StoreCategoryResponse {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export class StoreCategoryNotFoundError extends Error {
  constructor() {
    super('store_category_not_found');
  }
}

export class StoreCategoryValidationError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    super('store_category_validation_error');
  }
}

export class StoreCategorySlugConflictError extends Error {
  constructor(public readonly slug: string) {
    super('store_category_slug_conflict');
  }
}

function serializeCategory(category: {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  sortOrder: number;
}): StoreCategoryResponse {
  return {
    id: category.id,
    tenantId: category.tenantId,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
  };
}

export class StoreCategoryService {
  constructor(private readonly repo: StoreCategoryRepository) {}

  async listAdmin(): Promise<StoreCategoryResponse[]> {
    const categories = await this.repo.listForCurrentTenant();
    return categories.map(serializeCategory);
  }

  async listPublic(): Promise<Array<Pick<StoreCategoryResponse, 'id' | 'name' | 'slug'>>> {
    const categories = await this.repo.listForCurrentTenant();
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    }));
  }

  async createAdmin(input: unknown): Promise<StoreCategoryResponse> {
    const validation = validateStoreCategoryInput(input);
    if (!validation.success) {
      throw new StoreCategoryValidationError(validation.errors);
    }

    const slug = await this.resolveUniqueSlug(validation.data.name, validation.data.slug ?? undefined);
    const sortOrder =
      validation.data.sort_order ?? (await this.repo.findMaxSortOrderForCurrentTenant()) + 1;
    const { tenantId } = requireTenantContext();

    const created = await this.repo.createForCurrentTenant({
      tenantId,
      name: validation.data.name,
      slug,
      sortOrder,
    });

    return serializeCategory(created);
  }

  async updateAdmin(id: string, input: unknown): Promise<StoreCategoryResponse> {
    const existing = await this.repo.findByIdForCurrentTenant(id);
    if (!existing) {
      throw new StoreCategoryNotFoundError();
    }

    const validation = validateStoreCategoryInput(input);
    if (!validation.success) {
      throw new StoreCategoryValidationError(validation.errors);
    }

    const slug = await this.resolveUniqueSlug(
      validation.data.name,
      validation.data.slug ?? undefined,
      existing.id,
    );

    const updated = await this.repo.updateForCurrentTenant(existing, {
      name: validation.data.name,
      slug,
      sortOrder: validation.data.sort_order,
    });

    return serializeCategory(updated);
  }

  async deleteAdmin(id: string): Promise<void> {
    const deleted = await this.repo.deleteByIdForCurrentTenant(id);
    if (!deleted) {
      throw new StoreCategoryNotFoundError();
    }
  }

  async reorderAdmin(input: unknown): Promise<StoreCategoryResponse[]> {
    const validation = validateStoreCategoryReorder(input);
    if (!validation.success) {
      throw new StoreCategoryValidationError(validation.errors);
    }

    const current = await this.repo.listForCurrentTenant();
    const currentIds = new Set(current.map((category) => category.id));
    const payloadIds = validation.data.items.map((item) => item.id);

    if (payloadIds.some((id) => !currentIds.has(id))) {
      throw new StoreCategoryValidationError({
        items: 'all category ids must belong to the current tenant',
      });
    }

    const reordered = await this.repo.reorderForCurrentTenant(
      validation.data.items.map((item, index) => ({
        id: item.id,
        sortOrder: item.sort_order ?? index,
      })),
    );

    return reordered.map(serializeCategory);
  }

  private async resolveUniqueSlug(
    name: string,
    requestedSlug?: string,
    ignoreId?: string,
  ): Promise<string> {
    const slug = requestedSlug ?? slugifyStoreName(name);
    if (!slug) {
      throw new StoreCategoryValidationError({
        slug: 'slug could not be generated from name',
      });
    }

    const existing = await this.repo.findBySlugForCurrentTenant(slug);
    if (existing && existing.id !== ignoreId) {
      throw new StoreCategorySlugConflictError(slug);
    }

    return slug;
  }
}
