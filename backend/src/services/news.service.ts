import type Redis from 'ioredis';
import type { News } from '../entities/News';
import type { NewsRepository } from '../repositories/news.repository';
import { requireTenantContext } from '../middleware/tenant-context';
import { invalidateByPattern } from '../utils/cache';
import type { CreateNewsInput, UpdateNewsInput, PublishNewsInput } from '../dtos/news.dto';
import { canTransition, canDelete } from '../lib/news/state';
import { validateNewsInput, validatePublishInput, parseISO8601 } from '../dtos/news.dto';

const ONE_HOUR_MS = 60 * 60 * 1000;

export interface NewsDetailResponse {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  author: string;
  category: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsListResponse {
  data: NewsDetailResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export class NewsNotFoundError extends Error {
  constructor() {
    super('news_not_found');
  }
}

export class NewsDuplicateSlugError extends Error {
  constructor() {
    super('news_slug_duplicate');
  }
}

export class NewsInvalidTransitionError extends Error {
  constructor(currentStatus: string, nextStatus: string) {
    super(`invalid_transition_from_${currentStatus}_to_${nextStatus}`);
  }
}

export class NewsCannotDeleteError extends Error {
  constructor(status: string) {
    super(`cannot_delete_${status}`);
  }
}

export class NewsPublishDateInPastError extends Error {
  constructor() {
    super('publish_at_too_far_in_past');
  }
}

function serializeNews(news: News): NewsDetailResponse {
  return {
    id: news.id,
    tenantId: news.tenantId,
    title: news.title,
    slug: news.slug,
    summary: news.summary,
    body: news.body,
    coverImageUrl: news.coverImageUrl,
    author: news.author,
    category: news.category,
    status: news.status,
    publishedAt: news.publishedAt,
    createdAt: news.createdAt,
    updatedAt: news.updatedAt,
  };
}

function buildCacheKey(tenantId: string, id: string): string {
  return `news:detail:${tenantId}:${id}`;
}

export class NewsService {
  constructor(
    private readonly newsRepo: NewsRepository,
    private readonly redis: Redis,
  ) {}

  async getByIdForCurrentTenant(id: string): Promise<NewsDetailResponse> {
    const news = await this.newsRepo.findByIdForCurrentTenant(id);
    if (!news) {
      throw new NewsNotFoundError();
    }
    return serializeNews(news);
  }

  async createForCurrentTenant(input: CreateNewsInput): Promise<NewsDetailResponse> {
    const errors = validateNewsInput(input);
    if (errors.length > 0) {
      throw new Error(`validation_error: ${errors.map((e) => e.field).join(', ')}`);
    }

    if (!input.title || !input.summary || !input.body || !input.author || !input.category) {
      throw new Error('missing_required_fields');
    }

    const { tenantId } = requireTenantContext();

    // Generate slug if not provided
    let slug = input.slug;
    if (!slug) {
      slug = input.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 255);
    }

    // Check for duplicate slug
    const existing = await this.newsRepo.findBySlugForCurrentTenant(slug);
    if (existing) {
      throw new NewsDuplicateSlugError();
    }

    const created = await this.newsRepo.createForCurrentTenant({
      title: input.title,
      slug,
      summary: input.summary,
      body: input.body,
      coverImageUrl: input.cover_image_url,
      author: input.author,
      category: input.category,
    });

    // Invalidate list cache
    await invalidateByPattern(this.redis, `news:list:${tenantId}:*`);

    return serializeNews(created);
  }

  async updateForCurrentTenant(id: string, input: UpdateNewsInput): Promise<NewsDetailResponse> {
    const errors = validateNewsInput(input);
    if (errors.length > 0) {
      throw new Error(`validation_error: ${errors.map((e) => e.field).join(', ')}`);
    }

    const { tenantId } = requireTenantContext();
    const news = await this.newsRepo.findByIdForCurrentTenant(id);
    if (!news) {
      throw new NewsNotFoundError();
    }

    // Check for duplicate slug if slug is being changed
    if (input.slug && input.slug !== news.slug) {
      const existing = await this.newsRepo.findBySlugForCurrentTenant(input.slug);
      if (existing) {
        throw new NewsDuplicateSlugError();
      }
    }

    const updated = await this.newsRepo.updateForCurrentTenant(id, {
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      coverImageUrl: input.cover_image_url,
      author: input.author,
      category: input.category,
    });

    if (!updated) {
      throw new NewsNotFoundError();
    }

    // Invalidate caches
    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `news:list:${tenantId}:*`);

    return serializeNews(updated);
  }

  async publishForCurrentTenant(id: string, input: PublishNewsInput): Promise<NewsDetailResponse> {
    const errors = validatePublishInput(input);
    if (errors.length > 0) {
      throw new Error(`validation_error: ${errors.map((e) => e.field).join(', ')}`);
    }

    const { tenantId } = requireTenantContext();
    const news = await this.newsRepo.findByIdForCurrentTenant(id);
    if (!news) {
      throw new NewsNotFoundError();
    }

    if (news.status === 'published') {
      throw new NewsInvalidTransitionError(news.status, 'published');
    }

    let publishedAt: Date;
    let newStatus: string;

    if (input.publish_at) {
      const parsedDate = parseISO8601(input.publish_at);
      if (!parsedDate) {
        throw new Error('invalid_publish_at');
      }

      const now = new Date();
      const tooFarPast = new Date(now.getTime() - ONE_HOUR_MS);

      if (parsedDate < tooFarPast) {
        throw new NewsPublishDateInPastError();
      }

      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
      if (parsedDate <= oneMinuteFromNow) {
        // Publish immediately
        newStatus = 'published';
        publishedAt = now;
      } else {
        // Schedule for future
        newStatus = 'scheduled';
        publishedAt = parsedDate;
      }
    } else {
      // Publish immediately
      newStatus = 'published';
      publishedAt = new Date();
    }

    if (!canTransition(news.status, newStatus)) {
      throw new NewsInvalidTransitionError(news.status, newStatus);
    }

    const updated = await this.newsRepo.updateStatusForCurrentTenant(id, newStatus, publishedAt);
    if (!updated) {
      throw new NewsNotFoundError();
    }

    // Invalidate caches
    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `news:list:${tenantId}:*`);

    return serializeNews(updated);
  }

  async archiveForCurrentTenant(id: string): Promise<NewsDetailResponse> {
    const { tenantId } = requireTenantContext();
    const news = await this.newsRepo.findByIdForCurrentTenant(id);
    if (!news) {
      throw new NewsNotFoundError();
    }

    if (!canTransition(news.status, 'archived')) {
      throw new NewsInvalidTransitionError(news.status, 'archived');
    }

    const updated = await this.newsRepo.updateStatusForCurrentTenant(id, 'archived');
    if (!updated) {
      throw new NewsNotFoundError();
    }

    // Invalidate caches
    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `news:list:${tenantId}:*`);

    return serializeNews(updated);
  }

  async deleteForCurrentTenant(id: string): Promise<void> {
    const { tenantId } = requireTenantContext();
    const news = await this.newsRepo.findByIdForCurrentTenant(id);
    if (!news) {
      throw new NewsNotFoundError();
    }

    if (!canDelete(news.status)) {
      throw new NewsCannotDeleteError(news.status);
    }

    await this.newsRepo.deleteForCurrentTenant(id);

    // Invalidate caches
    await this.redis.del(buildCacheKey(tenantId, id));
    await invalidateByPattern(this.redis, `news:list:${tenantId}:*`);
  }

  async listForCurrentTenant(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    search?: string,
  ): Promise<NewsListResponse> {
    const result = await this.newsRepo.listForCurrentTenant(page, pageSize, status, search);
    return {
      data: result.data.map(serializeNews),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async publishScheduledNews(): Promise<{ count: number; tenantIds: string[] }> {
    const scheduledNews = await this.newsRepo.findScheduledReadyToPublish();

    if (scheduledNews.length === 0) {
      return { count: 0, tenantIds: [] };
    }

    const tenantIds = new Set<string>();
    const now = new Date();

    for (const news of scheduledNews) {
      await this.newsRepo.updateStatusForCurrentTenant(news.id, 'published', now);
      tenantIds.add(news.tenantId);
    }

    // Invalidate caches for all affected tenants
    for (const tenantId of tenantIds) {
      await invalidateByPattern(this.redis, `news:list:${tenantId}:*`);
      await invalidateByPattern(this.redis, `news:detail:${tenantId}:*`);
    }

    return { count: scheduledNews.length, tenantIds: Array.from(tenantIds) };
  }
}
