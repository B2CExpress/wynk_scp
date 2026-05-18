import type Redis from 'ioredis';
import type { Category } from '../src/entities/Category';
import { runWithTenantContext, type TenantContext } from '../src/middleware/tenant-context';
import type { StoreRepository } from '../src/repositories/store.repository';
import {
  StoreService,
  StoreSlugConflictError,
  StoreValidationError,
} from '../src/services/store.service';

const CTX: TenantContext = {
  tenantId: 'tenant-a',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

function makeRedisMock(): Redis {
  return {
    get: jest.fn(async () => null),
    set: jest.fn(async () => 'OK'),
    scan: jest.fn(async () => ['0', []]),
    del: jest.fn(async () => 0),
  } as unknown as Redis;
}

function makeCategory(partial?: Partial<Category>): Category {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    tenantId: CTX.tenantId,
    slug: 'roupas',
    name: 'Roupas',
    sortOrder: 0,
    createdAt: new Date('2026-05-16T12:00:00Z'),
    updatedAt: new Date('2026-05-16T12:00:00Z'),
    ...partial,
  };
}

function makeStore(partial?: Record<string, unknown>) {
  return {
    id: '22222222-2222-2222-2222-222222222222',
    tenantId: CTX.tenantId,
    name: 'Loja Bacana',
    slug: 'loja-bacana',
    description: null,
    logoUrl: null,
    coverImageUrl: null,
    externalUrl: null,
    floor: 'L1',
    phone: null,
    openingHours: null,
    isRestaurant: false,
    isFeatured: false,
    status: 'active',
    sortOrder: 0,
    createdAt: new Date('2026-05-16T12:00:00Z'),
    updatedAt: new Date('2026-05-16T12:00:00Z'),
    ...partial,
  };
}

describe('StoreService admin CRUD helpers', () => {
  it('auto-generates slug and sanitizes description on create', async () => {
    const createSpy = jest.fn(async () => makeStore());
    const hydrateSpy = jest.fn(async () => ({
      ...makeStore({ description: '<p>Oferta</p>' }),
      categories: [makeCategory()],
    }));

    const repo = {
      findBySlugForCurrentTenant: jest.fn(async () => null),
      countCategoriesForCurrentTenant: jest.fn(async () => 1),
      createForCurrentTenant: createSpy,
      findByIdWithCategoriesAdmin: hydrateSpy,
    } as unknown as StoreRepository;

    const service = new StoreService(repo, makeRedisMock());

    const result = await runWithTenantContext(CTX, () =>
      service.createAdmin({
        name: 'Loja Bacana',
        description: '<p>Oferta</p><script>alert(1)</script>',
        category_ids: ['11111111-1111-4111-8111-111111111111'],
      }),
    );

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'loja-bacana',
        description: '<p>Oferta</p>',
        categoryIds: ['11111111-1111-4111-8111-111111111111'],
      }),
    );
    expect(result.slug).toBe('loja-bacana');
    expect(result.description).toBe('<p>Oferta</p>');
    expect(result.categories).toEqual([
      { id: '11111111-1111-4111-8111-111111111111', name: 'Roupas', slug: 'roupas' },
    ]);
  });

  it('throws validation error on invalid create payload', async () => {
    const repo = {} as StoreRepository;
    const service = new StoreService(repo, makeRedisMock());

    await expect(
      runWithTenantContext(CTX, () =>
        service.createAdmin({
          name: 'a',
          slug: 'Slug-Invalido',
        }),
      ),
    ).rejects.toBeInstanceOf(StoreValidationError);
  });

  it('throws conflict when generated slug already exists in the tenant', async () => {
    const repo = {
      findBySlugForCurrentTenant: jest.fn(async () => makeStore()),
    } as unknown as StoreRepository;
    const service = new StoreService(repo, makeRedisMock());

    await expect(
      runWithTenantContext(CTX, () =>
        service.createAdmin({
          name: 'Loja Bacana',
        }),
      ),
    ).rejects.toBeInstanceOf(StoreSlugConflictError);
  });

  it('clears categories on update when category_ids is null', async () => {
    const updateSpy = jest.fn(async () => makeStore());
    const repo = {
      findByIdForCurrentTenant: jest.fn(async () => makeStore()),
      updateForCurrentTenant: updateSpy,
      findByIdWithCategoriesAdmin: jest.fn(async () => ({
        ...makeStore(),
        categories: [],
      })),
    } as unknown as StoreRepository;
    const service = new StoreService(repo, makeRedisMock());

    await runWithTenantContext(CTX, () =>
      service.updateAdmin('store-1', {
        category_ids: null,
      }),
    );

    expect(updateSpy).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({
        categoryIds: [],
      }),
    );
  });
});
