import type { DataSource, Repository } from 'typeorm';
import { TheaterShow } from '../entities/TheaterShow';
import { TheaterSession } from '../entities/TheaterSession';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export interface TheaterShowWithSessions extends TheaterShow {
  sessions?: Array<{
    id: string;
    showId: string;
    startsAt: Date;
    ticketUrl: string | null;
    isSoldOut: boolean;
  }>;
}

export class TheaterShowRepository {
  private readonly dataSource: DataSource;
  private readonly showRepo: Repository<TheaterShow>;
  private readonly sessionRepo: Repository<TheaterSession>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.showRepo = dataSource.getRepository(TheaterShow);
    this.sessionRepo = dataSource.getRepository(TheaterSession);
  }

  async findByIdForCurrentTenant(id: string): Promise<TheaterShowWithSessions | null> {
    const show = await withTenant(this.showRepo.createQueryBuilder('show'))
      .andWhere('show.show_id = :id', { id })
      .getOne();

    if (!show) {
      return null;
    }

    const sessions = await this.sessionRepo.find({
      where: { showId: id },
      order: { startsAt: 'ASC' },
    });

    return {
      ...show,
      sessions: sessions.map((s) => ({
        id: s.id,
        showId: s.showId,
        startsAt: s.startsAt,
        ticketUrl: s.ticketUrl,
        isSoldOut: s.isSoldOut,
      })),
    };
  }

  async createForCurrentTenant(input: {
    title: string;
    synopsis: string;
    durationMinutes: number;
    ageRating: string;
    ticketUrl?: string | null;
  }): Promise<TheaterShow> {
    const { tenantId } = requireTenantContext();

    const show = this.showRepo.create({
      tenantId,
      title: input.title,
      synopsis: input.synopsis,
      durationMinutes: input.durationMinutes,
      ageRating: input.ageRating,
      ticketUrl: input.ticketUrl ?? null,
      status: 'draft',
    });

    return this.showRepo.save(show);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      title?: string;
      synopsis?: string;
      durationMinutes?: number;
      ageRating?: string;
      ticketUrl?: string | null;
    },
  ): Promise<TheaterShow | null> {
    const show = await withTenant(this.showRepo.createQueryBuilder('show'))
      .andWhere('show.show_id = :id', { id })
      .getOne();

    if (!show) {
      return null;
    }

    if (input.title !== undefined) show.title = input.title;
    if (input.synopsis !== undefined) show.synopsis = input.synopsis;
    if (input.durationMinutes !== undefined) show.durationMinutes = input.durationMinutes;
    if (input.ageRating !== undefined) show.ageRating = input.ageRating;
    if (input.ticketUrl !== undefined) show.ticketUrl = input.ticketUrl;

    return this.showRepo.save(show);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const show = await withTenant(this.showRepo.createQueryBuilder('show'))
      .andWhere('show.show_id = :id', { id })
      .getOne();

    if (!show) {
      return false;
    }

    // DELETE CASCADE on sessions
    const { tenantId } = requireTenantContext();
    await this.sessionRepo.delete({ showId: id, tenantId });
    await this.showRepo.remove(show);

    return true;
  }

  async publishForCurrentTenant(id: string): Promise<TheaterShow | null> {
    const show = await withTenant(this.showRepo.createQueryBuilder('show'))
      .andWhere('show.show_id = :id', { id })
      .getOne();

    if (!show) {
      return null;
    }

    show.status = 'published';
    show.publishedAt = new Date();
    return this.showRepo.save(show);
  }

  async listScheduledForPublish(): Promise<TheaterShow[]> {
    const { tenantId } = requireTenantContext();
    return this.showRepo.find({
      where: {
        tenantId,
        status: 'scheduled',
      },
    });
  }
}
