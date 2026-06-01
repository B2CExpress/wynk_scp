import type Redis from 'ioredis';
import type { DataSource } from 'typeorm';
import { Store } from '../entities/Store';
import { Event } from '../entities/Event';
import { News } from '../entities/News';
import { Promotion } from '../entities/Promotion';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';
import { cached } from '../utils/cache';

const CACHE_TTL_SECONDS = 60; // 1 min

export interface DashboardMetrics {
  stores_total: number;
  stores_active: number;
  events_upcoming: number;
  posts_published_30d: number;
  newsletter_subscribers: number;
  promotions_active: number;
  ga?: {
    configured: boolean;
    users_30d?: number;
    pageviews_30d?: number;
    error?: boolean;
  };
}

export class AdminDashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: Redis,
  ) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const { tenantId } = requireTenantContext();
    const cacheKey = `dashboard:${tenantId}`;

    const { data } = await cached(this.redis, cacheKey, CACHE_TTL_SECONDS, async () => {
      const metrics = await this.aggregateMetrics();
      return metrics;
    });

    return data;
  }

  private async aggregateMetrics(): Promise<DashboardMetrics> {
    // Run all metric queries in parallel. Tenant scoping is applied by
    // `withTenant()`, which reads the tenant from the request context (ALS).
    const [stores, events, news, promotions] = await Promise.all([
      this.getStoresMetrics(),
      this.getEventsMetrics(),
      this.getNewsMetrics(),
      this.getPromotionsMetrics(),
    ]);

    // TODO: Newsletter metrics not yet implemented — replace with actual query when table exists
    // For now, return 0 as placeholder
    const newsletter_subscribers = 0;

    return {
      stores_total: stores.total,
      stores_active: stores.active,
      events_upcoming: events.upcoming,
      posts_published_30d: news.published_30d,
      newsletter_subscribers,
      promotions_active: promotions.active,
      // GA4 is optional, not included in parallel batch to avoid delaying response
    };
  }

  private async getStoresMetrics(): Promise<{ total: number; active: number }> {
    const storeRepo = this.dataSource.getRepository(Store);

    const qb = withTenant(storeRepo.createQueryBuilder('store')).select(
      `
        COUNT(CASE WHEN store.store_status = 'active' THEN 1 END) as active,
        COUNT(*) as total
      `,
    );

    const result = await qb.getRawOne();

    return {
      total: parseInt(result.total, 10) || 0,
      active: parseInt(result.active, 10) || 0,
    };
  }

  private async getEventsMetrics(): Promise<{ upcoming: number }> {
    const eventRepo = this.dataSource.getRepository(Event);
    const now = new Date();

    const qb = withTenant(eventRepo.createQueryBuilder('event')).where(
      'event.event_starts_at > :now',
      { now },
    );

    const upcoming = await qb.getCount();

    return { upcoming };
  }

  private async getNewsMetrics(): Promise<{ published_30d: number }> {
    const newsRepo = this.dataSource.getRepository(News);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const qb = withTenant(newsRepo.createQueryBuilder('news'))
      .where('news.news_status = :status', { status: 'published' })
      .andWhere('news.news_published_at >= :thirtyDaysAgo', { thirtyDaysAgo });

    const published_30d = await qb.getCount();

    return { published_30d };
  }

  private async getPromotionsMetrics(): Promise<{ active: number }> {
    const promotionRepo = this.dataSource.getRepository(Promotion);
    const now = new Date();

    const qb = withTenant(promotionRepo.createQueryBuilder('promotion'))
      .where('promotion.promotion_status = :status', { status: 'published' })
      .andWhere('promotion.promotion_valid_from <= :now', { now })
      .andWhere('promotion.promotion_valid_until > :now', { now });

    const active = await qb.getCount();

    return { active };
  }

  // Optional: GA4 metrics (called separately to avoid blocking on slow API)
  async getGA4Metrics(): Promise<{
    configured: boolean;
    users_30d?: number;
    pageviews_30d?: number;
    error?: boolean;
  }> {
    // TODO: Implement GA4 integration
    // For now, return stub
    return {
      configured: false,
    };
  }
}
