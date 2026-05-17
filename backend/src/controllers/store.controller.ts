import type { Request, Response, NextFunction } from 'express';
import type { StoreService } from '../services/store.service';
import { parseStoreListQuery } from '../dtos/store-list.dto';
import {
  InvalidStoreCategoriesError,
  StoreNotFoundError,
  StoreSlugConflictError,
  StoreValidationError,
} from '../services/store.service';

const CACHE_CONTROL_HEADER = 'public, max-age=300, s-maxage=300';
// trust proxy = true → req.hostname vem de X-Forwarded-Host quando atrás de proxy.
// Vary garante que CDN/cache intermediário não sirva resposta de um tenant pra outro.
const VARY_HEADER = 'X-Forwarded-Host';

export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = parseStoreListQuery(req.query as Record<string, unknown>);
      const { response, cacheHit } = await this.storeService.listActive(query);

      res.setHeader('Cache-Control', CACHE_CONTROL_HEADER);
      res.setHeader('Vary', VARY_HEADER);
      res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
      res.json(response);
    } catch (err) {
      next(err);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const store = await this.storeService.getActiveBySlug(slug);
      res.json(store);
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        res.status(404).json({ error: 'store_not_found' });
        return;
      }
      next(err);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.storeService.createAdmin(req.body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof StoreValidationError) {
        res.status(400).json({ error: 'validation_error', details: err.errors });
        return;
      }
      if (err instanceof InvalidStoreCategoriesError) {
        res.status(422).json({ error: 'invalid_category_ids' });
        return;
      }
      if (err instanceof StoreSlugConflictError) {
        res.status(409).json({ error: 'store_slug_conflict', slug: err.slug });
        return;
      }
      next(err);
    }
  };

  updateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.storeService.updateAdmin(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        res.status(404).json({ error: 'store_not_found' });
        return;
      }
      if (err instanceof StoreValidationError) {
        res.status(400).json({ error: 'validation_error', details: err.errors });
        return;
      }
      if (err instanceof InvalidStoreCategoriesError) {
        res.status(422).json({ error: 'invalid_category_ids' });
        return;
      }
      if (err instanceof StoreSlugConflictError) {
        res.status(409).json({ error: 'store_slug_conflict', slug: err.slug });
        return;
      }
      next(err);
    }
  };

  deleteAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.storeService.deleteAdmin(req.params.id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        res.status(404).json({ error: 'store_not_found' });
        return;
      }
      next(err);
    }
  };

  listAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;
      const featured = req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined;
      const search = req.query.search as string | undefined;

      const result = await this.storeService.listAdminWithFilters({
        page,
        limit,
        status,
        featured,
        search: search ? search.toLowerCase().trim() : undefined,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getDetailAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const store = await this.storeService.getDetailAdmin(req.params.id);
      res.json(store);
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        res.status(404).json({ error: 'store_not_found' });
        return;
      }
      next(err);
    }
  };
}
