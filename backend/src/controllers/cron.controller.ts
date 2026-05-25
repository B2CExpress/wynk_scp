import type { Request, Response } from 'express';
import type { NewsService } from '../services/news.service';

export class CronController {
  constructor(private readonly newsService: NewsService) {}

  async publishScheduledNews(req: Request, res: Response): Promise<void> {
    try {
      const cronSecret = req.headers['x-cron-secret'] as string | undefined;
      const expectedSecret = process.env.CRON_SECRET;

      if (!expectedSecret) {
        res.status(500).json({ error: 'CRON_SECRET not configured' });
        return;
      }

      if (!cronSecret || cronSecret !== expectedSecret) {
        res.status(401).json({ error: 'Invalid or missing X-Cron-Secret header' });
        return;
      }

      const result = await this.newsService.publishScheduledNews();

      res.json({
        promoted: {
          news: result.count,
        },
        tenants_affected: result.tenantIds,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
