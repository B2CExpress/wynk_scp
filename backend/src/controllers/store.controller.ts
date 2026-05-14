import type { Request, Response, NextFunction } from 'express';
import type { StoreService } from '../services/store.service';
import { parseStoreListQuery } from '../dtos/store-list.dto';
import {
  InvalidStoreCategoriesError,
  StoreNotFoundError,
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
      const body = this.parseAdminBody(req.body as Record<string, unknown>);
      const created = await this.storeService.createAdmin(body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof InvalidStoreCategoriesError) {
        res.status(422).json({ error: 'invalid_category_ids' });
        return;
      }
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  updateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = this.parseAdminBody(req.body as Record<string, unknown>);
      const updated = await this.storeService.updateAdmin(req.params.id, body);
      res.json(updated);
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        res.status(404).json({ error: 'store_not_found' });
        return;
      }
      if (err instanceof InvalidStoreCategoriesError) {
        res.status(422).json({ error: 'invalid_category_ids' });
        return;
      }
      next(err);
    }
  };

  private parseAdminBody(body: Record<string, unknown>) {
    return {
      name: typeof body.name === 'string' ? body.name : undefined,
      slug: typeof body.slug === 'string' ? body.slug : undefined,
      logoUrl: typeof body.logo_url === 'string' ? body.logo_url : undefined,
      coverImageUrl:
        typeof body.cover_image_url === 'string' ? body.cover_image_url : undefined,
      floor: typeof body.floor === 'string' ? body.floor : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      isRestaurant:
        typeof body.is_restaurant === 'boolean' ? body.is_restaurant : undefined,
      isFeatured: typeof body.is_featured === 'boolean' ? body.is_featured : undefined,
      status: typeof body.status === 'string' ? body.status : undefined,
      sortOrder: typeof body.sort_order === 'number' ? body.sort_order : undefined,
      categoryIds: Array.isArray(body.category_ids)
        ? body.category_ids.filter((value): value is string => typeof value === 'string')
        : undefined,
    };
  }
}
