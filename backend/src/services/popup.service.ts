import type Redis from 'ioredis';
import type { Popup } from '../entities/Popup';
import { PopupRepository } from '../repositories/popup.repository';
import type { PopupDTO } from '../dtos/popup.dto';
import { cached, invalidateByPattern } from '../utils/cache';
import { requireTenantContext } from '../middleware/tenant-context';

export interface PopupDetailResponse {
  id: string;
  tenantId: string;
  title: string;
  imageUrl: string | null;
  htmlContent: string | null;
  linkUrl: string | null;
  showAfterSeconds: number;
  showOnlyOnce: boolean;
  showOnPages: 'home' | 'all';
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export class PopupNotFoundError extends Error {
  constructor() {
    super('popup_not_found');
  }
}

export class PopupEndDateMinorOrEqualStartDateError extends Error {
  constructor() {
    super('ends_before_or_at_start');
  }
}

function serializePopup(popup: Popup): PopupDetailResponse {
  return {
    id: popup.id,
    tenantId: popup.tenantId,
    title: popup.title,
    imageUrl: popup.imageUrl,
    htmlContent: popup.htmlContent,
    linkUrl: popup.linkUrl,
    showAfterSeconds: popup.showAfterSeconds,
    showOnlyOnce: popup.showOnlyOnce,
    showOnPages: popup.showOnPages,
    startsAt: popup.startsAt,
    endsAt: popup.endsAt,
    isActive: popup.isActive,
  };
}

function detailCacheKey(tenantId: string, id: string): string {
  return `popup:detail:${tenantId}:${id}`;
}

function listCacheKey(tenantId: string): string {
  return `popup:list:${tenantId}:all`;
}

function activeCacheKey(tenantId: string): string {
  return `popup:active:${tenantId}`;
}

export class PopupService {
  constructor(
    private popupRepo: PopupRepository,
    private redis: Redis,
  ) {}

  /**
   * Invalida todas as caches do tenant afetadas por uma mutação. A chave
   * `active` precisa cair em QUALQUER mutação (create/update/delete/
   * activate/deactivate), senão o endpoint público serve popup obsoleto por
   * até 5 min após uma troca de ativo.
   */
  private async invalidateCaches(tenantId: string, id?: string): Promise<void> {
    await this.redis.del(activeCacheKey(tenantId));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);
    if (id) {
      await this.redis.del(detailCacheKey(tenantId, id));
    }
  }

  async getByIdForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const result = await cached<PopupDetailResponse>(
      this.redis,
      detailCacheKey(tenantId, id),
      3600,
      async () => {
        const popup = await this.popupRepo.findByIdForCurrentTenant(id);
        if (!popup) throw new PopupNotFoundError();
        return serializePopup(popup);
      },
    );

    return result.data;
  }

  async createForCurrentTenant(input: Partial<PopupDTO>): Promise<PopupDetailResponse> {
    if (!input.title || !input.starts_at || !input.ends_at || !input.show_on_pages) {
      throw new Error('missing_required_fields');
    }

    const startsAt = new Date(input.starts_at);
    const endsAt = new Date(input.ends_at);

    if (endsAt <= startsAt) throw new PopupEndDateMinorOrEqualStartDateError();

    const { tenantId } = requireTenantContext();

    const newPopup = await this.popupRepo.createForCurrentTenant({
      title: input.title,
      imageUrl: input.image_url ?? null,
      htmlContent: input.html_content ?? null,
      linkUrl: input.link_url ?? null,
      showAfterSeconds: input.show_after_seconds ?? 3,
      showOnlyOnce: input.show_only_once ?? true,
      showOnPages: input.show_on_pages,
      startsAt,
      endsAt,
    });

    await this.invalidateCaches(tenantId);
    return serializePopup(newPopup);
  }

  async updateForCurrentTenant(id: string, input: Partial<PopupDTO>): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    const mergedStartsAt = input.starts_at ? new Date(input.starts_at) : popup.startsAt;
    const mergedEndsAt = input.ends_at ? new Date(input.ends_at) : popup.endsAt;

    if (mergedEndsAt <= mergedStartsAt) throw new PopupEndDateMinorOrEqualStartDateError();

    const updated = await this.popupRepo.updateForCurrentTenant(id, {
      title: input.title,
      imageUrl: input.image_url,
      htmlContent: input.html_content,
      linkUrl: input.link_url,
      showAfterSeconds: input.show_after_seconds,
      showOnlyOnce: input.show_only_once,
      showOnPages: input.show_on_pages,
      startsAt: input.starts_at ? new Date(input.starts_at) : undefined,
      endsAt: input.ends_at ? new Date(input.ends_at) : undefined,
    });

    if (!updated) throw new PopupNotFoundError();

    await this.invalidateCaches(tenantId, id);

    return serializePopup(updated);
  }

  async deleteForCurrentTenant(id: string): Promise<void> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    await this.popupRepo.deleteForCurrentTenant(id);

    await this.invalidateCaches(tenantId, id);
  }

  async activateForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    await this.popupRepo.runInTransaction(async (txRepository: PopupRepository) => {
      await txRepository.deactivateAllForCurrentTenant();
      await txRepository.updateStatusForCurrentTenant(id, true);
    });

    const activatedPopup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!activatedPopup) throw new PopupNotFoundError();

    await this.invalidateCaches(tenantId, id);

    return serializePopup(activatedPopup);
  }

  async deactivateForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    await this.popupRepo.updateStatusForCurrentTenant(id, false);

    const deactivatedPopup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!deactivatedPopup) throw new PopupNotFoundError();

    await this.invalidateCaches(tenantId, id);

    return serializePopup(deactivatedPopup);
  }

  async listForCurrentTenant(): Promise<PopupDetailResponse[]> {
    const { tenantId } = requireTenantContext();

    const result = await cached<PopupDetailResponse[]>(
      this.redis,
      listCacheKey(tenantId),
      300,
      async () => {
        const data = await this.popupRepo.findAllForCurrentTenant();
        return data.map(serializePopup);
      },
    );

    return result.data;
  }

  async getActivePopupForClient(): Promise<PopupDetailResponse | null> {
    const { tenantId } = requireTenantContext();

    const result = await cached<PopupDetailResponse | null>(
      this.redis,
      activeCacheKey(tenantId),
      300,
      async () => {
        const popup = await this.popupRepo.findActiveForCurrentTenant(new Date());
        if (!popup) return null;
        return serializePopup(popup);
      },
    );

    return result.data;
  }
}
