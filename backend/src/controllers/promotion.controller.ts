import type { Request, Response, NextFunction } from 'express';
import type { PromotionService } from '../services/promotion.service';
import {
  PromotionNotFoundError,
  StoreNotFoundError,
  SlugConflictError,
  CannotDeleteError,
} from '../services/promotion.service';
import { parsePromotionInput, validatePromotionInput } from '../dtos/promotion.dto';

export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        store_id: req.query.store_id as string | undefined,
        expired: req.query.expired === 'true' ? true : req.query.expired === 'false' ? false : undefined,
      };

      const result = await this.promotionService.listForCurrentTenant(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const promotion = await this.promotionService.getByIdForCurrentTenant(id);
      res.json(promotion);
    } catch (err) {
      if (err instanceof PromotionNotFoundError) {
        res.status(404).json({ error: 'promotion_not_found' });
        return;
      }
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = parsePromotionInput(req.body as Record<string, unknown>);
      const errors = validatePromotionInput(body, true);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const created = await this.promotionService.createForCurrentTenant(body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof StoreNotFoundError) {
        res.status(422).json({ error: 'store_not_found' });
        return;
      }
      if (err instanceof SlugConflictError) {
        res.status(409).json({ error: 'slug_conflict' });
        return;
      }
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const body = parsePromotionInput(req.body as Record<string, unknown>);
      const errors = validatePromotionInput(body, false);

      if (errors.length > 0) {
        res.status(400).json({ error: 'validation_failed', errors });
        return;
      }

      const updated = await this.promotionService.updateForCurrentTenant(id, body);
      res.json(updated);
    } catch (err) {
      if (err instanceof PromotionNotFoundError) {
        res.status(404).json({ error: 'promotion_not_found' });
        return;
      }
      if (err instanceof StoreNotFoundError) {
        res.status(422).json({ error: 'store_not_found' });
        return;
      }
      if (err instanceof SlugConflictError) {
        res.status(409).json({ error: 'slug_conflict' });
        return;
      }
      if (err instanceof Error && err.message === 'invalid_request') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      await this.promotionService.deleteForCurrentTenant(id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof PromotionNotFoundError) {
        res.status(404).json({ error: 'promotion_not_found' });
        return;
      }
      if (err instanceof CannotDeleteError) {
        res.status(409).json({ error: 'cannot_delete' });
        return;
      }
      next(err);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const published = await this.promotionService.publishForCurrentTenant(id);
      res.json(published);
    } catch (err) {
      if (err instanceof PromotionNotFoundError) {
        res.status(404).json({ error: 'promotion_not_found' });
        return;
      }
      next(err);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

      const archived = await this.promotionService.archiveForCurrentTenant(id);
      res.json(archived);
    } catch (err) {
      if (err instanceof PromotionNotFoundError) {
        res.status(404).json({ error: 'promotion_not_found' });
        return;
      }
      next(err);
    }
  };
}
