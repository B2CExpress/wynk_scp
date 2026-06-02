import type Redis from 'ioredis';
import { PopupService, PopupNotFoundError } from '../src/services/popup.service';
import { PopupEndDateMinorOrEqualStartDateError } from '../src/services/popup.service';
import type { PopupRepository } from '../src/repositories/popup.repository';
import type { Popup } from '../src/entities/Popup';
import { runWithTenantContext } from '../src/middleware/tenant-context';
import type { TenantContext } from '../src/middleware/tenant-context';

const CTX: TenantContext = {
  tenantId: 'tenant-a',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

function makePopup(overrides: Partial<Popup> = {}): Popup {
  return {
    id: 'pop-1',
    tenantId: 'tenant-a',
    title: 'Campanha',
    imageUrl: 'https://cdn/x.jpg',
    htmlContent: null,
    linkUrl: null,
    showAfterSeconds: 3,
    showOnlyOnce: true,
    showOnPages: 'home',
    startsAt: new Date('2026-06-01T00:00:00Z'),
    endsAt: new Date('2026-06-30T23:59:59Z'),
    isActive: false,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  } as Popup;
}

function makeRedisMock(): { redis: Redis; store: Map<string, string>; delSpy: jest.Mock } {
  const store = new Map<string, string>();
  const delSpy = jest.fn(async (...keys: string[]) => {
    let count = 0;
    for (const k of keys) if (store.delete(k)) count++;
    return count;
  });
  const redis = {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK' as const;
    }),
    scan: jest.fn(async (_cursor: string, _match: string, pattern: string) => {
      const prefix = pattern.replace(/\*$/, '');
      return ['0', [...store.keys()].filter((k) => k.startsWith(prefix))];
    }),
    del: delSpy,
  } as unknown as Redis;
  return { redis, store, delSpy };
}

describe('PopupService.activateForCurrentTenant', () => {
  it('deactivates all then activates this one, inside a transaction', async () => {
    const order: string[] = [];
    const deactivateAll = jest.fn(async () => {
      order.push('deactivateAll');
    });
    const updateStatus = jest.fn(async (_id: string, _active: boolean) => {
      order.push(`updateStatus:${_id}:${_active}`);
    });

    const repo = {
      findByIdForCurrentTenant: jest
        .fn()
        .mockResolvedValueOnce(makePopup()) // pré-checagem de existência
        .mockResolvedValueOnce(makePopup({ isActive: true })), // releitura pós-tx
      runInTransaction: jest.fn(async (cb: (tx: PopupRepository) => Promise<void>) => {
        await cb({
          deactivateAllForCurrentTenant: deactivateAll,
          updateStatusForCurrentTenant: updateStatus,
        } as unknown as PopupRepository);
      }),
    } as unknown as PopupRepository;

    const { redis, delSpy } = makeRedisMock();
    const service = new PopupService(repo, redis);

    const result = await runWithTenantContext(CTX, () => service.activateForCurrentTenant('pop-1'));

    expect(result.isActive).toBe(true);
    expect(order).toEqual(['deactivateAll', 'updateStatus:pop-1:true']);
    // cache do popup ativo precisa ser invalidada
    expect(delSpy).toHaveBeenCalledWith('popup:active:tenant-a');
  });

  it('throws PopupNotFoundError (→ 404) when the popup does not exist', async () => {
    const repo = {
      findByIdForCurrentTenant: jest.fn().mockResolvedValue(null),
      runInTransaction: jest.fn(),
    } as unknown as PopupRepository;
    const { redis } = makeRedisMock();
    const service = new PopupService(repo, redis);

    await expect(
      runWithTenantContext(CTX, () => service.activateForCurrentTenant('missing')),
    ).rejects.toBeInstanceOf(PopupNotFoundError);
    expect(repo.runInTransaction).not.toHaveBeenCalled();
  });
});

describe('PopupService.deactivateForCurrentTenant', () => {
  it('throws PopupNotFoundError when missing', async () => {
    const repo = {
      findByIdForCurrentTenant: jest.fn().mockResolvedValue(null),
    } as unknown as PopupRepository;
    const { redis } = makeRedisMock();
    const service = new PopupService(repo, redis);

    await expect(
      runWithTenantContext(CTX, () => service.deactivateForCurrentTenant('missing')),
    ).rejects.toBeInstanceOf(PopupNotFoundError);
  });
});

describe('PopupService.createForCurrentTenant', () => {
  it('maps snake_case input to the repository and applies defaults', async () => {
    const createSpy = jest.fn(async () => makePopup());
    const repo = { createForCurrentTenant: createSpy } as unknown as PopupRepository;
    const { redis } = makeRedisMock();
    const service = new PopupService(repo, redis);

    await runWithTenantContext(CTX, () =>
      service.createForCurrentTenant({
        title: 'Campanha',
        image_url: 'https://cdn/x.jpg',
        show_on_pages: 'home',
        starts_at: '2026-06-01T00:00:00-03:00',
        ends_at: '2026-06-30T23:59:59-03:00',
      }),
    );

    expect(createSpy).toHaveBeenCalledTimes(1);
    const arg = createSpy.mock.calls[0][0];
    expect(arg).toMatchObject({
      title: 'Campanha',
      imageUrl: 'https://cdn/x.jpg',
      htmlContent: null,
      linkUrl: null,
      showAfterSeconds: 3,
      showOnlyOnce: true,
      showOnPages: 'home',
    });
    expect(arg.startsAt).toBeInstanceOf(Date);
    expect(arg.endsAt).toBeInstanceOf(Date);
  });

  it('rejects ends_at <= starts_at', async () => {
    const repo = { createForCurrentTenant: jest.fn() } as unknown as PopupRepository;
    const { redis } = makeRedisMock();
    const service = new PopupService(repo, redis);

    await expect(
      runWithTenantContext(CTX, () =>
        service.createForCurrentTenant({
          title: 'Campanha',
          image_url: 'https://cdn/x.jpg',
          show_on_pages: 'home',
          starts_at: '2026-06-30T00:00:00-03:00',
          ends_at: '2026-06-01T00:00:00-03:00',
        }),
      ),
    ).rejects.toBeInstanceOf(PopupEndDateMinorOrEqualStartDateError);
    expect(repo.createForCurrentTenant).not.toHaveBeenCalled();
  });
});

describe('PopupService.getActivePopupForClient', () => {
  it('returns the serialized active popup within its schedule window', async () => {
    const repo = {
      findActiveForCurrentTenant: jest.fn(async () => makePopup({ isActive: true })),
    } as unknown as PopupRepository;
    const { redis } = makeRedisMock();
    const service = new PopupService(repo, redis);

    const result = await runWithTenantContext(CTX, () => service.getActivePopupForClient());
    expect(result).not.toBeNull();
    expect(result?.id).toBe('pop-1');
    expect(result?.isActive).toBe(true);
  });

  it('returns null when there is no active popup', async () => {
    const repo = {
      findActiveForCurrentTenant: jest.fn(async () => null),
    } as unknown as PopupRepository;
    const { redis } = makeRedisMock();
    const service = new PopupService(repo, redis);

    const result = await runWithTenantContext(CTX, () => service.getActivePopupForClient());
    expect(result).toBeNull();
  });
});
