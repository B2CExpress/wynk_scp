import type { DataSource, Repository } from 'typeorm';
import { Popup } from '../entities/Popup';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class PopupRepository {
  private readonly dataSource: DataSource;
  private readonly popupRepo: Repository<Popup>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.popupRepo = dataSource.getRepository(Popup);
  }

  async findByIdForCurrentTenant(id: string): Promise<Popup | null> {
    return withTenant(this.popupRepo.createQueryBuilder('popup'))
      .andWhere('popup.id = :id', { id })
      .getOne();
  }

  async createForCurrentTenant(input: {
    title: string;
    imageUrl: string;
    htmlContent: string;
    linkUrl: string;
    showAfter_seconds: number;
    showOnlyOnce: boolean;
    showOnPages: string[];
    startsAt: Date;
    endsAt: Date;
  }): Promise<Popup> {
    const { tenantId } = requireTenantContext();

    const popup = this.popupRepo.create({
      tenantId,
      title: input.title,
      image_url: input.imageUrl,
      html_content: input.htmlContent,
      link_url: input.linkUrl,
      show_after_seconds: input.showAfter_seconds,
      show_only_once: input.showOnlyOnce,
      show_on_pages: input.showOnPages,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      isActive: false,
    });

    return this.popupRepo.save(popup);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      title?: string;
      imageUrl?: string;
      htmlContent?: string;
      linkUrl?: string;
      showAfter_seconds?: number;
      showOnlyOnce?: boolean;
      showOnPages?: string[];
      startsAt?: Date;
      endsAt?: Date;
      isActive?: boolean;
    },
  ): Promise<Popup | null> {
    const popup = await this.findByIdForCurrentTenant(id);
    if (!popup) {
      return null;
    }

    if (input.title !== undefined) popup.title = input.title;
    if (input.imageUrl !== undefined) popup.image_url = input.imageUrl;
    if (input.htmlContent !== undefined) popup.html_content = input.htmlContent;
    if (input.linkUrl !== undefined) popup.link_url = input.linkUrl;
    if (input.showAfter_seconds !== undefined) popup.show_after_seconds = input.showAfter_seconds;
    if (input.showOnlyOnce !== undefined) popup.show_only_once = input.showOnlyOnce;
    if (input.showOnPages !== undefined) popup.show_on_pages = input.showOnPages;
    if (input.startsAt !== undefined) popup.starts_at = input.startsAt;
    if (input.endsAt !== undefined) popup.ends_at = input.endsAt;
    if (input.isActive !== undefined) popup.isActive = input.isActive;

    return this.popupRepo.save(popup);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const popup = await this.findByIdForCurrentTenant(id);
    if (!popup) {
      return false;
    }

    await this.popupRepo.remove(popup);
    return true;
  }

  async checkActiveOverlapForCurrentTenant(
    showOnPages: string[],
    startsAt: Date,
    endsAt: Date,
    ignoreId?: string,
  ): Promise<boolean> {
    const query = withTenant(this.popupRepo.createQueryBuilder('popup'))
      .andWhere('popup.isActive = :isActive', { isActive: true })
      .andWhere('popup.starts_at < :endsAt', { endsAt })
      .andWhere('popup.ends_at > :startsAt', { startsAt })
      .andWhere('popup.show_on_pages && :showOnPages', { showOnPages });

    if (ignoreId) {
      query.andWhere('popup.id != :ignoreId', { ignoreId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async findAllPaginatedForCurrentTenant(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ data: Popup[]; total: number; page: number; pageSize: number }> {
    const query = withTenant(this.popupRepo.createQueryBuilder('popup'));

    const total = await query.getCount();
    const offset = (page - 1) * pageSize;

    const data = await query
      .orderBy('popup.starts_at', 'DESC')
      .offset(offset)
      .limit(pageSize)
      .getMany();

    return { data, total, page, pageSize };
  }
}