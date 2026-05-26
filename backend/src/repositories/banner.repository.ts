import type { DataSource, Repository } from 'typeorm';
import { Banner } from '../entities/Banner';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class BannerRepository {
  private readonly dataSource: DataSource;
  private readonly bannerRepo: Repository<Banner>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.bannerRepo = dataSource.getRepository(Banner);
  }

  async listForCurrentTenant(): Promise<Banner[]> {
    return withTenant(this.bannerRepo.createQueryBuilder('banner'))
      .orderBy('banner.banner_sort_order', 'ASC')
      .getMany();
  }

  async findByIdForCurrentTenant(id: string): Promise<Banner | null> {
    return withTenant(this.bannerRepo.createQueryBuilder('banner'))
      .andWhere('banner.banner_id = :id', { id })
      .getOne();
  }

  async createForCurrentTenant(input: {
    title: string;
    imageDesktopUrl: string;
    imageMobileUrl: string;
    altText: string;
    linkUrl?: string | null;
    linkTarget?: string;
    startsAt?: Date | null;
    endsAt?: Date | null;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<Banner> {
    const { tenantId } = requireTenantContext();

    const banner = this.bannerRepo.create({
      tenantId,
      title: input.title,
      imageDesktopUrl: input.imageDesktopUrl,
      imageMobileUrl: input.imageMobileUrl,
      altText: input.altText,
      linkUrl: input.linkUrl ?? null,
      linkTarget: input.linkTarget ?? '_self',
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    return this.bannerRepo.save(banner);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      title?: string;
      imageDesktopUrl?: string;
      imageMobileUrl?: string;
      altText?: string;
      linkUrl?: string | null;
      linkTarget?: string;
      startsAt?: Date | null;
      endsAt?: Date | null;
      isActive?: boolean;
      sortOrder?: number;
    },
  ): Promise<Banner | null> {
    const banner = await this.findByIdForCurrentTenant(id);
    if (!banner) {
      return null;
    }

    if (input.title !== undefined) banner.title = input.title;
    if (input.imageDesktopUrl !== undefined) banner.imageDesktopUrl = input.imageDesktopUrl;
    if (input.imageMobileUrl !== undefined) banner.imageMobileUrl = input.imageMobileUrl;
    if (input.altText !== undefined) banner.altText = input.altText;
    if (input.linkUrl !== undefined) banner.linkUrl = input.linkUrl;
    if (input.linkTarget !== undefined) banner.linkTarget = input.linkTarget;
    if (input.startsAt !== undefined) banner.startsAt = input.startsAt;
    if (input.endsAt !== undefined) banner.endsAt = input.endsAt;
    if (input.isActive !== undefined) banner.isActive = input.isActive;
    if (input.sortOrder !== undefined) banner.sortOrder = input.sortOrder;

    return this.bannerRepo.save(banner);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const banner = await this.findByIdForCurrentTenant(id);
    if (!banner) {
      return false;
    }

    await this.bannerRepo.remove(banner);
    return true;
  }

  async reorderForCurrentTenant(
    banners: Array<{ id: string; sortOrder: number }>,
  ): Promise<number> {
    const { tenantId } = requireTenantContext();

    let updatedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      const bannerRepo = manager.getRepository(Banner);

      for (const { id, sortOrder } of banners) {
        await bannerRepo.update(
          { id, tenantId },
          { sortOrder },
        );
        updatedCount++;
      }
    });

    return updatedCount;
  }

  async toggleIsActiveForCurrentTenant(id: string): Promise<Banner | null> {
    const banner = await this.findByIdForCurrentTenant(id);
    if (!banner) {
      return null;
    }

    banner.isActive = !banner.isActive;
    return this.bannerRepo.save(banner);
  }
}
