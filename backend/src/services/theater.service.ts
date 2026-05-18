import type Redis from 'ioredis';
import type { TheaterShowRepository } from '../repositories/theater-show.repository';
import type { TheaterSessionRepository } from '../repositories/theater-session.repository';
import { requireTenantContext } from '../middleware/tenant-context';
import { invalidateByPattern } from '../utils/cache';
import type { CreateTheaterShowInput, UpdateTheaterShowInput, CreateTheaterSessionInput, UpdateTheaterSessionInput } from '../dtos/theater.dto';

export interface TheaterSessionResponse {
  id: string;
  showId: string;
  startsAt: Date;
  ticketUrl: string | null;
  isSoldOut: boolean;
}

export interface TheaterShowDetailResponse {
  id: string;
  tenantId: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: string;
  ticketUrl: string | null;
  status: string;
  publishedAt: Date | null;
  sessions?: TheaterSessionResponse[];
}

export class TheaterShowNotFoundError extends Error {
  constructor() {
    super('show_not_found');
  }
}

export class TheaterSessionNotFoundError extends Error {
  constructor() {
    super('session_not_found');
  }
}

export class SessionConflictError extends Error {
  constructor() {
    super('session_conflict');
  }
}

export class TheaterService {
  constructor(
    private readonly showRepo: TheaterShowRepository,
    private readonly sessionRepo: TheaterSessionRepository,
    private readonly redis: Redis,
  ) {}

  async getShowByIdForCurrentTenant(id: string): Promise<TheaterShowDetailResponse> {
    const show = await this.showRepo.findByIdForCurrentTenant(id);
    if (!show) {
      throw new TheaterShowNotFoundError();
    }

    return {
      id: show.id,
      tenantId: show.tenantId,
      title: show.title,
      synopsis: show.synopsis,
      durationMinutes: show.durationMinutes,
      ageRating: show.ageRating,
      ticketUrl: show.ticketUrl,
      status: show.status,
      publishedAt: show.publishedAt,
      sessions: show.sessions?.map((s) => ({
        id: s.id,
        showId: s.showId || show.id,
        startsAt: s.startsAt,
        ticketUrl: s.ticketUrl,
        isSoldOut: s.isSoldOut,
      })),
    };
  }

  async createShowForCurrentTenant(input: CreateTheaterShowInput): Promise<TheaterShowDetailResponse> {
    if (!input.title || !input.synopsis || input.duration_minutes === undefined || !input.age_rating) {
      throw new Error('invalid_request');
    }

    const duration = typeof input.duration_minutes === 'string'
      ? Number.parseInt(input.duration_minutes, 10)
      : input.duration_minutes;

    if (!Number.isInteger(duration) || duration < 10 || duration > 600) {
      throw new Error('invalid_request');
    }

    const created = await this.showRepo.createForCurrentTenant({
      title: input.title,
      synopsis: input.synopsis,
      durationMinutes: duration,
      ageRating: input.age_rating,
      ticketUrl: input.ticket_url,
    });

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);

    return {
      id: created.id,
      tenantId: created.tenantId,
      title: created.title,
      synopsis: created.synopsis,
      durationMinutes: created.durationMinutes,
      ageRating: created.ageRating,
      ticketUrl: created.ticketUrl,
      status: created.status,
      publishedAt: created.publishedAt,
    };
  }

  async updateShowForCurrentTenant(id: string, input: UpdateTheaterShowInput): Promise<TheaterShowDetailResponse> {
    const duration = input.duration_minutes !== undefined
      ? typeof input.duration_minutes === 'string'
        ? Number.parseInt(input.duration_minutes, 10)
        : input.duration_minutes
      : undefined;

    if (duration !== undefined && (!Number.isInteger(duration) || duration < 10 || duration > 600)) {
      throw new Error('invalid_request');
    }

    const updated = await this.showRepo.updateForCurrentTenant(id, {
      title: input.title,
      synopsis: input.synopsis,
      durationMinutes: duration,
      ageRating: input.age_rating,
      ticketUrl: input.ticket_url,
    });

    if (!updated) {
      throw new TheaterShowNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      title: updated.title,
      synopsis: updated.synopsis,
      durationMinutes: updated.durationMinutes,
      ageRating: updated.ageRating,
      ticketUrl: updated.ticketUrl,
      status: updated.status,
      publishedAt: updated.publishedAt,
    };
  }

  async deleteShowForCurrentTenant(id: string): Promise<void> {
    const deleted = await this.showRepo.deleteForCurrentTenant(id);
    if (!deleted) {
      throw new TheaterShowNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);
  }

  async publishShowForCurrentTenant(id: string): Promise<TheaterShowDetailResponse> {
    const published = await this.showRepo.publishForCurrentTenant(id);
    if (!published) {
      throw new TheaterShowNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);

    return {
      id: published.id,
      tenantId: published.tenantId,
      title: published.title,
      synopsis: published.synopsis,
      durationMinutes: published.durationMinutes,
      ageRating: published.ageRating,
      ticketUrl: published.ticketUrl,
      status: published.status,
      publishedAt: published.publishedAt,
    };
  }

  async addSessionForCurrentTenant(showId: string, input: CreateTheaterSessionInput): Promise<TheaterSessionResponse> {
    // Verify show exists in current tenant
    const show = await this.showRepo.findByIdForCurrentTenant(showId);
    if (!show) {
      throw new TheaterShowNotFoundError();
    }

    if (!input.starts_at) {
      throw new Error('invalid_request');
    }

    const startsAt = new Date(input.starts_at);
    if (Number.isNaN(startsAt.getTime())) {
      throw new Error('invalid_request');
    }

    // Check for conflicts
    const hasConflict = await this.sessionRepo.hasConflict(showId, startsAt);
    if (hasConflict) {
      throw new SessionConflictError();
    }

    const session = await this.sessionRepo.createForCurrentTenant({
      showId,
      startsAt,
      ticketUrl: input.ticket_url,
    });

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);

    return {
      id: session.id,
      showId: session.showId,
      startsAt: session.startsAt,
      ticketUrl: session.ticketUrl,
      isSoldOut: session.isSoldOut,
    };
  }

  async updateSessionForCurrentTenant(id: string, input: UpdateTheaterSessionInput): Promise<TheaterSessionResponse> {
    const updated = await this.sessionRepo.updateForCurrentTenant(id, {
      startsAt: input.starts_at ? new Date(input.starts_at) : undefined,
      ticketUrl: input.ticket_url,
      isSoldOut: input.is_sold_out,
    });

    if (!updated) {
      throw new TheaterSessionNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);

    return {
      id: updated.id,
      showId: updated.showId,
      startsAt: updated.startsAt,
      ticketUrl: updated.ticketUrl,
      isSoldOut: updated.isSoldOut,
    };
  }

  async deleteSessionForCurrentTenant(id: string): Promise<void> {
    const deleted = await this.sessionRepo.deleteForCurrentTenant(id);
    if (!deleted) {
      throw new TheaterSessionNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateShowListings(tenantId);
  }

  async invalidateShowListings(tenantId: string): Promise<void> {
    await invalidateByPattern(this.redis, `shows:detail:${tenantId}:*`);
    await invalidateByPattern(this.redis, `shows:list:${tenantId}:*`);
  }
}
