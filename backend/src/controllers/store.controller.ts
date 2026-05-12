import type { Request, Response, NextFunction } from 'express';
import type { StoreService } from '../services/store.service';
import { parseStoreListQuery } from '../dtos/store-list.dto';

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
}
