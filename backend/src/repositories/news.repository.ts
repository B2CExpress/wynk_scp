import type { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { News } from '../entities/News';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class NewsRepository {
  private readonly dataSource: DataSource;
  private readonly newsRepo: Repository<News>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.newsRepo = dataSource.getRepository(News);
  }

  async findByIdForCurrentTenant(id: string): Promise<News | null> {
    return withTenant(this.newsRepo.createQueryBuilder('news'))
      .andWhere('news.news_id = :id', { id })
      .getOne();
  }

  async findBySlugForCurrentTenant(slug: string): Promise<News | null> {
    return withTenant(this.newsRepo.createQueryBuilder('news'))
      .andWhere('news.news_slug = :slug', { slug })
      .getOne();
  }

  async createForCurrentTenant(input: {
    title: string;
    slug: string;
    summary: string;
    body: string;
    coverImageUrl?: string | null;
    author: string;
    category: string;
  }): Promise<News> {
    const { tenantId } = requireTenantContext();

    const news = this.newsRepo.create({
      tenantId,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      body: input.body,
      coverImageUrl: input.coverImageUrl ?? null,
      author: input.author,
      category: input.category,
      status: 'draft',
    });

    return this.newsRepo.save(news);
  }

  async updateForCurrentTenant(
    id: string,
    input: {
      title?: string;
      slug?: string;
      summary?: string;
      body?: string;
      coverImageUrl?: string | null;
      author?: string;
      category?: string;
    },
  ): Promise<News | null> {
    const news = await this.findByIdForCurrentTenant(id);
    if (!news) {
      return null;
    }

    if (input.title !== undefined) news.title = input.title;
    if (input.slug !== undefined) news.slug = input.slug;
    if (input.summary !== undefined) news.summary = input.summary;
    if (input.body !== undefined) news.body = input.body;
    if (input.coverImageUrl !== undefined) news.coverImageUrl = input.coverImageUrl;
    if (input.author !== undefined) news.author = input.author;
    if (input.category !== undefined) news.category = input.category;

    return this.newsRepo.save(news);
  }

  async updateStatusForCurrentTenant(
    id: string,
    status: string,
    publishedAt?: Date | null,
  ): Promise<News | null> {
    const news = await this.findByIdForCurrentTenant(id);
    if (!news) {
      return null;
    }

    news.status = status;
    if (publishedAt !== undefined) {
      news.publishedAt = publishedAt;
    }

    return this.newsRepo.save(news);
  }

  async deleteForCurrentTenant(id: string): Promise<boolean> {
    const news = await this.findByIdForCurrentTenant(id);
    if (!news) {
      return false;
    }

    await this.newsRepo.remove(news);
    return true;
  }

  async findScheduledForPublish(): Promise<News[]> {
    const now = new Date();
    return this.newsRepo.find({
      where: {
        status: 'scheduled',
      },
      order: {
        publishedAt: 'ASC',
      },
    });
  }

  async findScheduledReadyToPublish(): Promise<News[]> {
    const now = new Date();
    return this.newsRepo
      .createQueryBuilder('news')
      .where('news.news_status = :status', { status: 'scheduled' })
      .andWhere('news.news_published_at <= :now', { now })
      .orderBy('news.news_published_at', 'ASC')
      .getMany();
  }

  async listForCurrentTenant(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    search?: string,
  ): Promise<{ data: News[]; total: number; page: number; pageSize: number }> {
    let query = withTenant(this.newsRepo.createQueryBuilder('news'));

    if (status) {
      query = query.andWhere('news.news_status = :status', { status });
    }

    if (search) {
      query = query.andWhere(
        '(news.news_title ILIKE :search OR news.news_summary ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await query.getCount();
    const offset = (page - 1) * pageSize;

    const data = await query
      .orderBy('news.news_created_at', 'DESC')
      .offset(offset)
      .limit(pageSize)
      .getMany();

    return { data, total, page, pageSize };
  }
}
