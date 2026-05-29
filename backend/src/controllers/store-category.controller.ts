import type { NextFunction, Request, Response } from 'express';
import {
  StoreCategoryNotFoundError,
  StoreCategoryService,
  StoreCategorySlugConflictError,
  StoreCategoryValidationError,
} from '../services/store-category.service';

export class StoreCategoryController {
  constructor(private readonly service: StoreCategoryService) {}

  listPublic = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.listPublic();
      res.json({ data: categories });
    } catch (err) {
      next(err);
    }
  };

  listAdmin = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.listAdmin();
      res.json({ data: categories });
    } catch (err) {
      next(err);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.service.createAdmin(req.body);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof StoreCategoryValidationError) {
        res.status(400).json({ error: 'validation_error', details: err.errors });
        return;
      }
      if (err instanceof StoreCategorySlugConflictError) {
        res.status(409).json({ error: 'store_category_slug_conflict', slug: err.slug });
        return;
      }
      next(err);
    }
  };

  updateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await this.service.updateAdmin(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      if (err instanceof StoreCategoryNotFoundError) {
        res.status(404).json({ error: 'store_category_not_found' });
        return;
      }
      if (err instanceof StoreCategoryValidationError) {
        res.status(400).json({ error: 'validation_error', details: err.errors });
        return;
      }
      if (err instanceof StoreCategorySlugConflictError) {
        res.status(409).json({ error: 'store_category_slug_conflict', slug: err.slug });
        return;
      }
      next(err);
    }
  };

  deleteAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteAdmin(req.params.id);
      res.status(204).end();
    } catch (err) {
      if (err instanceof StoreCategoryNotFoundError) {
        res.status(404).json({ error: 'store_category_not_found' });
        return;
      }
      next(err);
    }
  };

  reorderAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reordered = await this.service.reorderAdmin(req.body);
      res.json({ data: reordered });
    } catch (err) {
      if (err instanceof StoreCategoryValidationError) {
        res.status(400).json({ error: 'validation_error', details: err.errors });
        return;
      }
      next(err);
    }
  };
}
