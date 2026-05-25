import type Redis from 'ioredis';
import type { EventRepository } from '../repositories/event.repository';
import { requireTenantContext } from '../middleware/tenant-context';
import { invalidateByPattern } from '../utils/cache';
import type { CreateEventInput, UpdateEventInput } from '../dtos/event.dto';

export interface EventDetailResponse {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  ticketInfo: string | null;
  status: string;
  publishedAt: Date | null;
}

export class EventNotFoundError extends Error {
  constructor() {
    super('event_not_found');
  }
}

function serializeEvent(event: EventDetailResponse): EventDetailResponse {
  return event;
}

export class EventService {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly redis: Redis,
  ) {}

  async getByIdForCurrentTenant(id: string): Promise<EventDetailResponse> {
    const event = await this.eventRepo.findByIdForCurrentTenant(id);
    if (!event) {
      throw new EventNotFoundError();
    }

    return serializeEvent({
      id: event.id,
      tenantId: event.tenantId,
      title: event.title,
      slug: event.slug,
      summary: event.summary,
      body: event.body,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      ticketInfo: event.ticketInfo,
      status: event.status,
      publishedAt: event.publishedAt,
    });
  }

  async createForCurrentTenant(input: CreateEventInput): Promise<EventDetailResponse> {
    if (!input.title || !input.summary || !input.body) {
      throw new Error('invalid_request');
    }
    if (!input.starts_at || !input.ends_at) {
      throw new Error('invalid_request');
    }

    // Parse ISO 8601 dates
    const startsAt = new Date(input.starts_at);
    const endsAt = new Date(input.ends_at);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new Error('invalid_request');
    }

    if (endsAt < startsAt) {
      throw new Error('invalid_request');
    }

    // Generate slug from title
    const slug = input.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 250);

    const created = await this.eventRepo.createForCurrentTenant({
      title: input.title,
      slug,
      summary: input.summary,
      body: input.body,
      startsAt,
      endsAt,
      location: input.location,
      ticketInfo: input.ticket_info,
    });

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);

    return serializeEvent({
      id: created.id,
      tenantId: created.tenantId,
      title: created.title,
      slug: created.slug,
      summary: created.summary,
      body: created.body,
      startsAt: created.startsAt,
      endsAt: created.endsAt,
      location: created.location,
      ticketInfo: created.ticketInfo,
      status: created.status,
      publishedAt: created.publishedAt,
    });
  }

  async updateForCurrentTenant(id: string, input: UpdateEventInput): Promise<EventDetailResponse> {
    const startsAt = input.starts_at ? new Date(input.starts_at) : undefined;
    const endsAt = input.ends_at ? new Date(input.ends_at) : undefined;

    if (startsAt && endsAt && endsAt < startsAt) {
      throw new Error('invalid_request');
    }

    const updated = await this.eventRepo.updateForCurrentTenant(id, {
      title: input.title,
      slug: input.title
        ? input.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 250)
        : undefined,
      summary: input.summary,
      body: input.body,
      startsAt,
      endsAt,
      location: input.location,
      ticketInfo: input.ticket_info,
    });

    if (!updated) {
      throw new EventNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);

    return serializeEvent({
      id: updated.id,
      tenantId: updated.tenantId,
      title: updated.title,
      slug: updated.slug,
      summary: updated.summary,
      body: updated.body,
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      location: updated.location,
      ticketInfo: updated.ticketInfo,
      status: updated.status,
      publishedAt: updated.publishedAt,
    });
  }

  async deleteForCurrentTenant(id: string): Promise<void> {
    const deleted = await this.eventRepo.deleteForCurrentTenant(id);
    if (!deleted) {
      throw new EventNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);
  }

  async publishForCurrentTenant(id: string): Promise<EventDetailResponse> {
    const published = await this.eventRepo.publishForCurrentTenant(id);
    if (!published) {
      throw new EventNotFoundError();
    }

    const { tenantId } = requireTenantContext();
    await this.invalidateListings(tenantId);

    return serializeEvent({
      id: published.id,
      tenantId: published.tenantId,
      title: published.title,
      slug: published.slug,
      summary: published.summary,
      body: published.body,
      startsAt: published.startsAt,
      endsAt: published.endsAt,
      location: published.location,
      ticketInfo: published.ticketInfo,
      status: published.status,
      publishedAt: published.publishedAt,
    });
  }

  async invalidateListings(tenantId: string): Promise<void> {
    await invalidateByPattern(this.redis, `events:detail:${tenantId}:*`);
    await invalidateByPattern(this.redis, `events:list:${tenantId}:*`);
  }
}
