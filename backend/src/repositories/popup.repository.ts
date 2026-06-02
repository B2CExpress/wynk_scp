import type { DataSource, Repository, EntityManager } from 'typeorm';
import { Popup } from '../entities/Popup';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class PopupRepository {
  private readonly dataSource: DataSource;
  private readonly popupRepo: Repository<Popup>;

  constructor(dataSource: DataSource, entityManager?: EntityManager) {
    this.dataSource = dataSource;
    this.popupRepo = entityManager
      ? entityManager.getRepository(Popup)
      : dataSource.getRepository(Popup);
  }

  async runInTransaction(
    callback: (txRepository: PopupRepository) => Promise<void>,
  ): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const txRepository = new PopupRepository(this.dataSource, transactionalEntityManager);
      await callback(txRepository);
    });
  }

  async findByIdForCurrentTenant(id: string): Promise<Popup | null> {
    return withTenant(this.popupRepo.createQueryBuilder('popup'))
      .andWhere('popup.id = :id', { id })
      .getOne();
  }

  async findAllForCurrentTenant(): Promise<Popup[]> {
    return withTenant(this.popupRepo.createQueryBuilder('popup'))
      .orderBy('popup.starts_at', 'DESC')
      .getMany();
  }

  async createForCurrentTenant(input: {
    title: string;
    imageUrl: string | null;
    htmlContent: string | null;
    linkUrl?: string;
    showAfter_seconds: number;
    showOnlyOnce: boolean;
    showOnPages: 'home' | 'all';
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
      imageUrl?: string | null;
      htmlContent?: string | null;
      linkUrl?: string;
      showAfter_seconds?: number;
      showOnlyOnce?: boolean;
      showOnPages?: 'home' | 'all';
      startsAt?: Date;
      endsAt?: Date;
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

  async deactivateAllForCurrentTenant(): Promise<void> {
    const { tenantId } = requireTenantContext();
    await this.popupRepo.update({ tenantId }, { isActive: false });
  }

  async updateStatusForCurrentTenant(id: string, isActive: boolean): Promise<void> {
    const { tenantId } = requireTenantContext();
    await this.popupRepo.update({ id, tenantId }, { isActive });
  }

  async findActiveForCurrentTenant(now: Date): Promise<Popup | null> {
    return withTenant(this.popupRepo.createQueryBuilder('popup'))
      .andWhere('popup.isActive = :isActive', { isActive: true })
      .andWhere('popup.starts_at <= :now', { now })
      .andWhere('popup.ends_at >= :now', { now })
      .getOne();
  }
}
