import type Redis from 'ioredis';
import type { PopupRepository } from '../repositories/popup.repository';
import type {
    CreatePopupInput, 
    UpdatePopupInput, 
} from '../dtos/popup.dto';
import { validatePopupInput } from '../dtos/popup.dto';
import { cached, invalidateByPattern } from '../utils/cache';
import { requireTenantContext } from '@/middleware/tenant-context';

export interface PopupDetailResponse {
  id: string,
  tenantId: string,
  title: string,
  imageUrl: string,
  htmlContent: string,
  linkUrl: string,
  showAfter_seconds: number,
  showOnlyOnce: boolean,
  showOnPages: string[],
  startsAt: Date,
  endsAt: Date,
}

export interface PopupListResponse {
  data: PopupDetailResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export class PopupNotFoundError extends Error {
  constructor() { super('popup_not_found'); }
}
export class PopupStartDateInPastError extends Error {
  constructor() { super('starts_at_too_far_in_past'); }
}
export class PopupEndDateMinorOrEqualStartDateError extends Error {
  constructor() { super('ends_before_or_at_start'); }
}
export class PopupPeriodConflict extends Error {
  constructor() { super('period_conflict') }
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
  }
}

function buildCacheKey(tenantId: string, id: string): string {
  return `popup:detail:${tenantId}:${id}`;
}

export class PopupService {
  constructor(
    private popupRepo: PopupRepository,
    private redis: Redis
  ) {}

  async getByIdForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();
    const cacheKey = buildCacheKey(tenantId, id);

    const result = await cached<PopupDetailResponse>(
      this.redis,
      cacheKey,
      3600,
      async () => {
        const popup = await this.popupRepo.findByIdForCurrentTenant(id);
        if (!popup) throw new PopupNotFoundError();
        return serializePopup(popup);
      }
    );

    return result.data;
  }
  
  async createForCurrentTenant(input: CreatePopupInput): Promise<PopupDetailResponse> {
    const errors = validatePopupInput(input);
    if (errors.length > 0) {
        throw new Error(`validation_error: ${errors.map((e) => e.field).join(', ')}`);
    }

    if (!input.title || !input.startsAt || !input.endsAt || !input.showOnPages) {
      throw new Error('missing_required_fields');
    }

    if (input.startsAt < new Date()) throw new PopupStartDateInPastError();
    if (input.endsAt <= input.startsAt) throw new PopupEndDateMinorOrEqualStartDateError();

    const { tenantId } = requireTenantContext();

    const hasConflict = await this.popupRepo.checkActiveOverlapForCurrentTenant(
      tenantId, 
      input.showOnPages, 
      input.startsAt, 
      input.endsAt
    );
    if (hasConflict) throw new PopupPeriodConflict();

    const newPopup = await this.popupRepo.createForCurrentTenant(input);
    
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);
    return serializePopup(newPopup);
  }

  async updateForCurrentTenant(id: string, input: UpdatePopupInput): Promise<PopupDetailResponse> {
    const errors = validatePopupInput(input);
    if (errors.length > 0) {
      throw new Error(`validation_error: ${errors.map((e) => e.field).join(', ')}`);
    }

    const { tenantId } = requireTenantContext();
    
    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    if (input.startsAt || input.endsAt || input.showOnPages) {
      const mergedStartsAt = input.startsAt ?? popup.startsAt;
      const mergedEndsAt = input.endsAt ?? popup.endsAt;
      const mergedShowOnPages = input.showOnPages ?? popup.showOnPages;

      if (input.startsAt && input.startsAt < new Date()) throw new PopupStartDateInPastError();
      if (mergedEndsAt <= mergedStartsAt) throw new PopupEndDateMinorOrEqualStartDateError();

      const hasConflict = await this.popupRepo.checkActiveOverlapForCurrentTenant(
        mergedShowOnPages,
        mergedStartsAt,
        mergedEndsAt,
        id
      );
      if (hasConflict) throw new PopupPeriodConflict();
    }

    const updated = await this.popupRepo.updateForCurrentTenant(id, {...input})
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

    const hasConflict = await this.popupRepo.checkActiveOverlapForCurrentTenant(
      popup.showOnPages,
      popup.startsAt,
      popup.endsAt,
      id
    );
    if (hasConflict) throw new PopupPeriodConflict();

    const activatedPopup = await this.popupRepo.updateForCurrentTenant(id, { isActive: true });
    if (!activatedPopup) throw new PopupNotFoundError();

    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);

    return serializePopup(activatedPopup);
  }

  async deactivateForCurrentTenant(id: string): Promise<PopupDetailResponse> {
    const { tenantId } = requireTenantContext();

    const popup = await this.popupRepo.findByIdForCurrentTenant(id);
    if (!popup) throw new PopupNotFoundError();

    const deactivatedPopup = await this.popupRepo.updateForCurrentTenant(id, { isActive: false });
    if (!deactivatedPopup) throw new PopupNotFoundError();

    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `popup:list:${tenantId}:*`);

    return serializePopup(deactivatedPopup);
  }

  async listForCurrentTenant(page: number, pageSize: number): Promise<PopupListResponse> {
    const { tenantId } = requireTenantContext();
    const cacheKey = `popup:list:${tenantId}:page:${page}:size:${pageSize}`;

    const result = await cached<PopupListResponse>(
      this.redis,
      cacheKey,
      300,
      async () => {
        const { data, total } = await this.popupRepo.findAllPaginatedForCurrentTenant(page, pageSize);
        
        return {
          data: data.map(serializePopup),
          total,
          page,
          pageSize,
        };
      }
    );

    return result.data;
  }
}