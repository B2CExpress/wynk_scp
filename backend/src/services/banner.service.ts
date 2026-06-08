import type Redis from 'ioredis';
import type { BannerRepository } from '../repositories/banner.repository';
import type { Banner } from '../entities/Banner';
import type { CreateBannerInput, UpdateBannerInput } from '../dtos/banner.dto';
import { requireTenantContext } from '../middleware/tenant-context';
import { invalidateByPattern } from '../utils/cache';
import { parseISO8601 } from '../dtos/banner.dto';

export interface BannerDetailResponse {
  id: string;
  title: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  altText: string;
  linkUrl: string | null;
  linkTarget: string;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BannerListResponse {
  data: BannerDetailResponse[];
}

export interface BannerToggleResponse {
  id: string;
  isActive: boolean;
}

export class BannerNotFoundError extends Error {
  constructor() {
    super('banner_not_found');
  }
}

function serializeBanner(banner: Banner): BannerDetailResponse {
  return {
    id: banner.id,
    title: banner.title,
    imageDesktopUrl: banner.imageDesktopUrl,
    imageMobileUrl: banner.imageMobileUrl,
    altText: banner.altText,
    linkUrl: banner.linkUrl,
    linkTarget: banner.linkTarget,
    startsAt: banner.startsAt,
    endsAt: banner.endsAt,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
    createdAt: banner.createdAt,
    updatedAt: banner.updatedAt,
  };
}

export class BannerService {
  constructor(
    private readonly bannerRepository: BannerRepository,
    private readonly redis: Redis,
  ) {}

  private getCacheKeyPattern(tenantId: string): string {
    return `banners:${tenantId}:*`;
  }

  private async invalidateBannersCache(tenantId: string): Promise<void> {
    await invalidateByPattern(this.redis, this.getCacheKeyPattern(tenantId));
  }

  async listForCurrentTenant(): Promise<BannerListResponse> {
    const banners = await this.bannerRepository.listForCurrentTenant();

    return {
      data: banners.map((banner) => serializeBanner(banner)),
    };
  }

  async getByIdForCurrentTenant(id: string): Promise<BannerDetailResponse> {
    const banner = await this.bannerRepository.findByIdForCurrentTenant(id);
    if (!banner) {
      throw new BannerNotFoundError();
    }

    return serializeBanner(banner);
  }

  async createForCurrentTenant(input: CreateBannerInput): Promise<BannerDetailResponse> {
    const { tenantId } = requireTenantContext();

    const banner = await this.bannerRepository.createForCurrentTenant({
      title: input.title!,
      imageDesktopUrl: input.image_desktop_url!,
      imageMobileUrl: input.image_mobile_url!,
      altText: input.alt_text!,
      linkUrl: input.link_url ?? null,
      linkTarget: input.link_target ?? '_self',
      startsAt: input.starts_at ? parseISO8601(input.starts_at) : null,
      endsAt: input.ends_at ? parseISO8601(input.ends_at) : null,
      isActive: input.is_active ?? true,
      sortOrder: input.sort_order ?? 0,
    });

    await this.invalidateBannersCache(tenantId);

    return serializeBanner(banner);
  }

  async updateForCurrentTenant(
    id: string,
    input: UpdateBannerInput,
  ): Promise<BannerDetailResponse> {
    const { tenantId } = requireTenantContext();

    const banner = await this.bannerRepository.updateForCurrentTenant(id, {
      title: input.title,
      imageDesktopUrl: input.image_desktop_url,
      imageMobileUrl: input.image_mobile_url,
      altText: input.alt_text,
      linkUrl: input.link_url !== undefined ? input.link_url : undefined,
      linkTarget: input.link_target,
      startsAt:
        input.starts_at !== undefined
          ? input.starts_at
            ? parseISO8601(input.starts_at)
            : null
          : undefined,
      endsAt:
        input.ends_at !== undefined
          ? input.ends_at
            ? parseISO8601(input.ends_at)
            : null
          : undefined,
      isActive: input.is_active,
      sortOrder: input.sort_order,
    });

    if (!banner) {
      throw new BannerNotFoundError();
    }

    await this.invalidateBannersCache(tenantId);

    return serializeBanner(banner);
  }

  async deleteForCurrentTenant(id: string): Promise<void> {
    const { tenantId } = requireTenantContext();

    const deleted = await this.bannerRepository.deleteForCurrentTenant(id);
    if (!deleted) {
      throw new BannerNotFoundError();
    }

    await this.invalidateBannersCache(tenantId);
  }

  async reorderForCurrentTenant(
    banners: Array<{ id: string; sort_order: number }>,
  ): Promise<{ ok: boolean; updated: number }> {
    const { tenantId } = requireTenantContext();

    const updated = await this.bannerRepository.reorderForCurrentTenant(
      banners.map(({ id, sort_order }) => ({ id, sortOrder: sort_order })),
    );

    await this.invalidateBannersCache(tenantId);

    return { ok: true, updated };
  }

  async toggleForCurrentTenant(id: string): Promise<BannerToggleResponse> {
    const { tenantId } = requireTenantContext();

    const banner = await this.bannerRepository.toggleIsActiveForCurrentTenant(id);
    if (!banner) {
      throw new BannerNotFoundError();
    }

    await this.invalidateBannersCache(tenantId);

    return {
      id: banner.id,
      isActive: banner.isActive,
    };
  }
}
