import type { DataSource, Repository } from 'typeorm';
import { Event } from '../entities/Event';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class EventRepository {
  private readonly dataSource: DataSource;
  private readonly eventRepo: Repository<Event>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.eventRepo = dataSource.getRepository(Event);
  }

  async findByIdForCurrentTenant(id: string): Promise<Event | null> {
    return withTenant(this.eventRepo.createQueryBuilder('event'))
      .andWhere('event.event_id = :id', { id })
      .getOne();
  }

  async findBySlugForCurrentTenant(slug: string): Promise<Event | null> {
    return withTenant(this.eventRepo.createQueryBuilder('event'))
      .andWhere('event.event_slug = :slug', { slug })
      .getOne();
  }

  async createForCurrentTenant(input: {
    title: string;
    slug: string;
    summary: string;
    body: string;
    startsAt: Date;
    endsAt: Date;
    location?: string | null;
    ticketInfo?: string | null;
  }): Promise<Event> {
    const { tenantId } = requireTenantContext();

    const event = this.eventRepo.create({
      tenantId,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location ?? null,
      ticketInfo: input.ticketInfo ?? null,
      status: 'draft',
    });

    return this.eventRepo.save(event);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      title?: string;
      slug?: string;
      summary?: string;
      body?: string;
      startsAt?: Date;
      endsAt?: Date;
      location?: string | null;
      ticketInfo?: string | null;
    },
  ): Promise<Event | null> {
    const event = await this.findByIdForCurrentTenant(id);
    if (!event) {
      return null;
    }

    if (input.title !== undefined) event.title = input.title;
    if (input.slug !== undefined) event.slug = input.slug;
    if (input.summary !== undefined) event.summary = input.summary;
    if (input.body !== undefined) event.body = input.body;
    if (input.startsAt !== undefined) event.startsAt = input.startsAt;
    if (input.endsAt !== undefined) event.endsAt = input.endsAt;
    if (input.location !== undefined) event.location = input.location;
    if (input.ticketInfo !== undefined) event.ticketInfo = input.ticketInfo;

    return this.eventRepo.save(event);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const event = await this.findByIdForCurrentTenant(id);
    if (!event) {
      return false;
    }

    await this.eventRepo.remove(event);
    return true;
  }

  async publishForCurrentTenant(id: string): Promise<Event | null> {
    const event = await this.findByIdForCurrentTenant(id);
    if (!event) {
      return null;
    }

    event.status = 'published';
    event.publishedAt = new Date();
    return this.eventRepo.save(event);
  }

  async listScheduledForPublish(): Promise<Event[]> {
    const { tenantId } = requireTenantContext();
    return this.eventRepo.find({
      where: {
        tenantId,
        status: 'scheduled',
      },
    });
  }

  async findPublishedForCurrentTenant(limit: number = 50): Promise<Event[]> {
    return withTenant(this.eventRepo.createQueryBuilder('event'))
      .andWhere('event.event_status = :status', { status: 'published' })
      .andWhere('event.event_published_at <= :now', { now: new Date() })
      .orderBy('event.event_published_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findPublishedBySlugForCurrentTenant(slug: string): Promise<Event | null> {
    return withTenant(this.eventRepo.createQueryBuilder('event'))
      .andWhere('event.event_slug = :slug', { slug })
      .andWhere('event.event_status = :status', { status: 'published' })
      .andWhere('event.event_published_at <= :now', { now: new Date() })
      .getOne();
  }
}
