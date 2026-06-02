import type Redis from 'ioredis';
import type { Hero } from '../entities/Hero';
import { HeroRepository } from '../repositories/hero.repository';
import { HERO_DEFAULTS, type HeroInput, type HeroResponse } from '../dtos/hero.dto';
import { cached } from '../utils/cache';
import { requireTenantContext } from '../middleware/tenant-context';

function serializeHero(hero: Hero): HeroResponse {
  return {
    title: hero.title,
    subtitle: hero.subtitle,
    backgroundImageUrl: hero.backgroundImageUrl,
    ctaText: hero.ctaText,
    ctaLink: hero.ctaLink,
    overlayColor: hero.overlayColor,
    overlayOpacity: hero.overlayOpacity,
  };
}

function cacheKey(tenantId: string): string {
  return `hero:${tenantId}`;
}

export class HeroService {
  constructor(
    private heroRepo: HeroRepository,
    private redis: Redis,
  ) {}

  /** Hero do tenant — `HERO_DEFAULTS` se ainda não configurou (nunca 404). */
  async getForCurrentTenant(): Promise<HeroResponse> {
    const { tenantId } = requireTenantContext();

    const result = await cached<HeroResponse>(this.redis, cacheKey(tenantId), 300, async () => {
      const hero = await this.heroRepo.findForCurrentTenant();
      return hero ? serializeHero(hero) : HERO_DEFAULTS;
    });

    return result.data;
  }

  /** UPSERT do hero do tenant; invalida o cache. `tenant_id` do payload é ignorado. */
  async upsertForCurrentTenant(input: Partial<HeroInput>): Promise<HeroResponse> {
    const { tenantId } = requireTenantContext();

    const hero = await this.heroRepo.upsertForCurrentTenant({
      title: input.title ?? '',
      subtitle: input.subtitle ?? null,
      backgroundImageUrl: input.background_image_url ?? '',
      ctaText: input.cta_text ?? null,
      ctaLink: input.cta_link ?? null,
      overlayColor: input.overlay_color ?? HERO_DEFAULTS.overlayColor,
      overlayOpacity: input.overlay_opacity ?? HERO_DEFAULTS.overlayOpacity,
    });

    await this.redis.del(cacheKey(tenantId));

    return serializeHero(hero);
  }
}
