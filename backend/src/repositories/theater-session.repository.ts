import type { DataSource, Repository } from 'typeorm';
import { TheaterSession } from '../entities/TheaterSession';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

const SESSION_CONFLICT_THRESHOLD_MS = 90 * 60 * 1000; // 90 minutes

export class TheaterSessionRepository {
  private readonly dataSource: DataSource;
  private readonly sessionRepo: Repository<TheaterSession>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.sessionRepo = dataSource.getRepository(TheaterSession);
  }

  async findByIdForCurrentTenant(id: string): Promise<TheaterSession | null> {
    return withTenant(this.sessionRepo.createQueryBuilder('session'))
      .andWhere('session.session_id = :id', { id })
      .getOne();
  }

  async findByShowId(showId: string): Promise<TheaterSession[]> {
    return withTenant(this.sessionRepo.createQueryBuilder('session'))
      .andWhere('session.show_id = :showId', { showId })
      .orderBy('session.session_starts_at', 'ASC')
      .getMany();
  }

  async hasConflict(showId: string, startsAt: Date): Promise<boolean> {
    const { tenantId } = requireTenantContext();

    const conflicting = await this.sessionRepo.find({
      where: {
        tenantId,
        showId,
      },
    });

    for (const session of conflicting) {
      const timeDiffMs = Math.abs(session.startsAt.getTime() - startsAt.getTime());
      if (timeDiffMs < SESSION_CONFLICT_THRESHOLD_MS) {
        return true;
      }
    }

    return false;
  }

  async createForCurrentTenant(input: {
    showId: string;
    startsAt: Date;
    ticketUrl?: string | null;
  }): Promise<TheaterSession> {
    const { tenantId } = requireTenantContext();

    const session = this.sessionRepo.create({
      tenantId,
      showId: input.showId,
      startsAt: input.startsAt,
      ticketUrl: input.ticketUrl ?? null,
      isSoldOut: false,
    });

    return this.sessionRepo.save(session);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      startsAt?: Date;
      ticketUrl?: string | null;
      isSoldOut?: boolean;
    },
  ): Promise<TheaterSession | null> {
    const session = await this.findByIdForCurrentTenant(id);
    if (!session) {
      return null;
    }

    if (input.startsAt !== undefined) session.startsAt = input.startsAt;
    if (input.ticketUrl !== undefined) session.ticketUrl = input.ticketUrl;
    if (input.isSoldOut !== undefined) session.isSoldOut = input.isSoldOut;

    return this.sessionRepo.save(session);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const session = await this.findByIdForCurrentTenant(id);
    if (!session) {
      return false;
    }

    await this.sessionRepo.remove(session);
    return true;
  }
}
