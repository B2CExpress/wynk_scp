import type { Request, Response } from 'express';
import type { NewsService } from '../services/news.service';
import {
  NewsNotFoundError,
  NewsDuplicateSlugError,
  NewsInvalidTransitionError,
  NewsCannotDeleteError,
  NewsPublishDateInPastError,
} from '../services/news.service';

export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  async listNews(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.page_size as string) || 20;
      const status = (req.query.status as string) || undefined;
      const search = (req.query.search as string) || undefined;

      const result = await this.newsService.listForCurrentTenant(page, pageSize, status, search);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const news = await this.newsService.getByIdForCurrentTenant(id);
      res.json(news);
    } catch (error) {
      if (error instanceof NewsNotFoundError) {
        res.status(404).json({ error: 'news_not_found' });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async createNews(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body;
      const news = await this.newsService.createForCurrentTenant(input);
      res.status(201).json(news);
    } catch (error) {
      if (error instanceof NewsDuplicateSlugError) {
        res.status(409).json({ error: 'Slug must be unique within tenant' });
      } else if (error instanceof Error) {
        if (error.message.includes('validation_error')) {
          res.status(400).json({ error: error.message });
        } else if (error.message === 'missing_required_fields') {
          res.status(400).json({ error: 'Missing required fields' });
        } else {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body;
      const news = await this.newsService.updateForCurrentTenant(id, input);
      res.json(news);
    } catch (error) {
      if (error instanceof NewsNotFoundError) {
        res.status(404).json({ error: 'news_not_found' });
      } else if (error instanceof NewsDuplicateSlugError) {
        res.status(409).json({ error: 'Slug must be unique within tenant' });
      } else if (error instanceof Error) {
        if (error.message.includes('validation_error')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async publishNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body || {};
      const news = await this.newsService.publishForCurrentTenant(id, input);
      res.json(news);
    } catch (error) {
      if (error instanceof NewsNotFoundError) {
        res.status(404).json({ error: 'news_not_found' });
      } else if (error instanceof NewsInvalidTransitionError) {
        res.status(409).json({ error: error.message });
      } else if (error instanceof NewsPublishDateInPastError) {
        res.status(400).json({ error: 'publish_at cannot be more than 1 hour in the past' });
      } else if (error instanceof Error) {
        if (error.message.includes('validation_error')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async archiveNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const news = await this.newsService.archiveForCurrentTenant(id);
      res.json(news);
    } catch (error) {
      if (error instanceof NewsNotFoundError) {
        res.status(404).json({ error: 'news_not_found' });
      } else if (error instanceof NewsInvalidTransitionError) {
        res.status(409).json({ error: error.message });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async deleteNews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.newsService.deleteForCurrentTenant(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NewsNotFoundError) {
        res.status(404).json({ error: 'news_not_found' });
      } else if (error instanceof NewsCannotDeleteError) {
        res.status(409).json({ error: `Cannot delete news with status: ${error.message}` });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
