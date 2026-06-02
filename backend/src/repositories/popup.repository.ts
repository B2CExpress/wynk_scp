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
      .andWhere('popup.popup_id = :id', { id })
      .getOne();
  }

  async findAllForCurrentTenant(): Promise<Popup[]> {
    return withTenant(this.popupRepo.createQueryBuilder('popup'))
      .orderBy('popup.popup_starts_at', 'DESC')
      .getMany();
  }

  async createForCurrentTenant(input: {
    title: string;
    imageUrl: string | null;
    htmlContent: string | null;
    linkUrl: string | null;
    showAfterSeconds: number;
    showOnlyOnce: boolean;
    showOnPages: 'home' | 'all';
    startsAt: Date;
    endsAt: Date;
  }): Promise<Popup> {
    const { tenantId } = requireTenantContext();

    const popup = this.popupRepo.create({
      tenantId,
      title: input.title,
      imageUrl: input.imageUrl,
      htmlContent: input.htmlContent,
      linkUrl: input.linkUrl,
      showAfterSeconds: input.showAfterSeconds,
      showOnlyOnce: input.showOnlyOnce,
      showOnPages: input.showOnPages,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
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
      linkUrl?: string | null;
      showAfterSeconds?: number;
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
    if (input.imageUrl !== undefined) popup.imageUrl = input.imageUrl;
    if (input.htmlContent !== undefined) popup.htmlContent = input.htmlContent;
    if (input.linkUrl !== undefined) popup.linkUrl = input.linkUrl;
    if (input.showAfterSeconds !== undefined) popup.showAfterSeconds = input.showAfterSeconds;
    if (input.showOnlyOnce !== undefined) popup.showOnlyOnce = input.showOnlyOnce;
    if (input.showOnPages !== undefined) popup.showOnPages = input.showOnPages;
    if (input.startsAt !== undefined) popup.startsAt = input.startsAt;
    if (input.endsAt !== undefined) popup.endsAt = input.endsAt;

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
      .andWhere('popup.popup_is_active = :isActive', { isActive: true })
      .andWhere('popup.popup_starts_at <= :now', { now })
      .andWhere('popup.popup_ends_at >= :now', { now })
      .getOne();
  }
}
