import type Redis from 'ioredis';
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
  linkUrl?: string;
  showAfter_seconds: number;
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

export class PopupStartDateInPastError extends Error {
  constructor() {
    super('starts_at_too_far_in_past');
  }
}

export class PopupEndDateMinorOrEqualStartDateError extends Error {
  constructor() {
    super('ends_before_or_at_start');
  }
}

function serializePopup(popup: any): PopupDetailResponse {
  return {
    id: popup.id,
    tenantId: popup.tenantId,
    title: popup.title,
    imageUrl: popup.image_url,
    htmlContent: popup.html_content,
    linkUrl: popup.link_url,
    showAfter_seconds: popup.show_after_seconds,
    showOnlyOnce: popup.show_only_once,
    showOnPages: popup.show_on_pages,
    startsAt: popup.starts_at,
    endsAt: popup.ends_at,
    isActive: popup.isActive,
  };
}

function buildCacheKey(tenantId: string, id: string): string {
  return `popup:detail:${tenantId}:${id}`;
}

export class PopupService {
  constructor(
    private popupRepo: PopupRepository,
    private redis: Redis,
  ) {}

  async getByIdForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();
    const cacheKey = buildCacheKey(tenantId, id);

    const result = await cached<PopupDetailResponse>(this.redis, cacheKey, 3600, async () => {
      const popup = await this.popupRepo.findByIdForCurrentTenant(id);
      if (!popup) throw new PopupNotFoundError();
      return serializePopup(popup);
    });

    return result.data;
  }

  async createForCurrentTenant(input: Partial<PopupDTO>): Promise<PopupDetailResponse> {
    if (!input.title || !input.starts_at || !input.ends_at || !input.show_on_pages) {
      throw new Error('missing_required_fields');
    }

    const startsAt = new Date(input.starts_at);
    const endsAt = new Date(input.ends_at);

    if (startsAt < new Date()) throw new PopupStartDateInPastError();
    if (endsAt <= startsAt) throw new PopupEndDateMinorOrEqualStartDateError();

    const { tenantId } = requireTenantContext();

    const newPopup = await this.popupRepo.createForCurrentTenant({
      title: input.title,
      imageUrl: input.image_url ?? null,
      htmlContent: input.html_content ?? null,
      linkUrl: input.link_url,
      showAfter_seconds: input.show_after_seconds ?? 3,
      showOnlyOnce: input.show_only_once ?? true,
      showOnPages: input.show_on_pages,
      startsAt,
      endsAt,
    });

    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);
    return serializePopup(newPopup);
  }

  async updateForCurrentTenant(id: string, input: Partial<PopupDTO>): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    const mergedStartsAt = input.starts_at ? new Date(input.starts_at) : popup.starts_at;
    const mergedEndsAt = input.ends_at ? new Date(input.ends_at) : popup.ends_at;

    if (input.starts_at && new Date(input.starts_at) < new Date())
      throw new PopupStartDateInPastError();
    if (mergedEndsAt <= mergedStartsAt) throw new PopupEndDateMinorOrEqualStartDateError();

    const updated = await this.popupRepo.updateForCurrentTenant(id, {
      title: input.title,
      imageUrl: input.image_url,
      htmlContent: input.html_content,
      linkUrl: input.link_url,
      showAfter_seconds: input.show_after_seconds,
      showOnlyOnce: input.show_only_once,
      showOnPages: input.show_on_pages,
      startsAt: input.starts_at ? new Date(input.starts_at) : undefined,
      endsAt: input.ends_at ? new Date(input.ends_at) : undefined,
    });

    if (!updated) throw new PopupNotFoundError();

    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);

    return serializePopup(updated);
  }

  async deleteForCurrentTenant(id: string): Promise<void> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    await this.popupRepo.deleteForCurrentTenant(id);

    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);
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

    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);

    return serializePopup(activatedPopup);
  }

  async deactivateForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    await this.popupRepo.updateStatusForCurrentTenant(id, false);

    const deactivatedPopup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!deactivatedPopup) throw new PopupNotFoundError();

    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);

    return serializePopup(deactivatedPopup);
  }

  async listForCurrentTenant(): Promise<PopupDetailResponse[]> {
    const { tenantId } = requireTenantContext();
    const cacheKey = `popup:list:${tenantId}:all`;

    const result = await cached<PopupDetailResponse[]>(this.redis, cacheKey, 300, async () => {
      const data = await this.popupRepo.findAllForCurrentTenant();
      return data.map(serializePopup);
    });

    return result.data;
  }

  async getActivePopupForClient(): Promise<PopupDetailResponse | null> {
    const { tenantId } = requireTenantContext();
    const cacheKey = `popup:active:${tenantId}`;

    const result = await cached<PopupDetailResponse | null>(this.redis, cacheKey, 300, async () => {
      const popup = await this.popupRepo.findActiveForCurrentTenant(new Date());
      if (!popup) return null;
      return serializePopup(popup);
    });

    return result.data;
  }
}
