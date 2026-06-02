import type Redis from 'ioredis';
import { HeroService } from '../src/services/hero.service';
import { HERO_DEFAULTS } from '../src/dtos/hero.dto';
import type { HeroRepository } from '../src/repositories/hero.repository';
import type { Hero } from '../src/entities/Hero';
import { runWithTenantContext } from '../src/middleware/tenant-context';
import type { TenantContext } from '../src/middleware/tenant-context';

const CTX: TenantContext = {
  tenantId: 'tenant-a',
  slug: 'shopping-x',
  flavorSlug: 'shopping-x',
};

function makeHero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: 'hero-1',
    tenantId: 'tenant-a',
    title: 'Bem-vindo',
    subtitle: 'A melhor experiência',
    backgroundImageUrl: 'https://cdn/hero.jpg',
    ctaText: 'Ver lojas',
    ctaLink: '/lojas',
    overlayColor: '#101010',
    overlayOpacity: 0.5,
    createdAt: new Date('2026-05-01T00:00:00Z'),
    updatedAt: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  } as Hero;
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

describe('HeroService.getForCurrentTenant', () => {
  it('returns HERO_DEFAULTS when the tenant has no hero', async () => {
    const repo = {
      findForCurrentTenant: jest.fn(async () => null),
    } as unknown as HeroRepository;
    const { redis } = makeRedisMock();
    const service = new HeroService(repo, redis);

    const result = await runWithTenantContext(CTX, () => service.getForCurrentTenant());
    expect(result).toEqual(HERO_DEFAULTS);
  });

  it('returns the serialized hero when it exists', async () => {
    const repo = {
      findForCurrentTenant: jest.fn(async () => makeHero()),
    } as unknown as HeroRepository;
    const { redis } = makeRedisMock();
    const service = new HeroService(repo, redis);

    const result = await runWithTenantContext(CTX, () => service.getForCurrentTenant());
    expect(result).toMatchObject({
      title: 'Bem-vindo',
      backgroundImageUrl: 'https://cdn/hero.jpg',
      ctaLink: '/lojas',
      overlayColor: '#101010',
      overlayOpacity: 0.5,
    });
  });
});

describe('HeroService.upsertForCurrentTenant', () => {
  it('maps snake_case input to the repository and invalidates cache', async () => {
    let captured: Record<string, unknown> | undefined;
    const upsertSpy = jest.fn(async (input: Record<string, unknown>) => {
      captured = input;
      return makeHero({ title: 'Novo título', backgroundImageUrl: 'https://cdn/new.jpg' });
    });
    const repo = { upsertForCurrentTenant: upsertSpy } as unknown as HeroRepository;
    const { redis, delSpy } = makeRedisMock();
    const service = new HeroService(repo, redis);

    const result = await runWithTenantContext(CTX, () =>
      service.upsertForCurrentTenant({
        title: 'Novo título',
        background_image_url: 'https://cdn/new.jpg',
        overlay_color: '#222222',
        overlay_opacity: 0.7,
      }),
    );

    expect(captured).toMatchObject({
      title: 'Novo título',
      backgroundImageUrl: 'https://cdn/new.jpg',
      overlayColor: '#222222',
      overlayOpacity: 0.7,
    });
    expect(result.title).toBe('Novo título');
    expect(delSpy).toHaveBeenCalledWith('hero:tenant-a');
  });

  it('ignores tenant_id from the payload (isolation)', async () => {
    let captured: Record<string, unknown> | undefined;
    const upsertSpy = jest.fn(async (input: Record<string, unknown>) => {
      captured = input;
      return makeHero();
    });
    const repo = { upsertForCurrentTenant: upsertSpy } as unknown as HeroRepository;
    const { redis } = makeRedisMock();
    const service = new HeroService(repo, redis);

    await runWithTenantContext(CTX, () =>
      service.upsertForCurrentTenant({
        title: 'X',
        background_image_url: 'https://cdn/x.jpg',
        // tenant_id no payload não tem efeito: o service nunca o lê
      } as never),
    );

    expect(captured).not.toHaveProperty('tenantId');
    expect(captured).not.toHaveProperty('tenant_id');
  });
});
