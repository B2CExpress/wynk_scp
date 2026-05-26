import type { Request, Response, NextFunction } from 'express';
import type { PromotionService } from '../services/promotion.service';

export class PublicPromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  listPublished = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Number.parseInt(req.query.limit as string, 10) || 200;
      const promotions = await this.promotionService.listPublishedActiveForCurrentTenant(limit);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Vary', 'X-Forwarded-Host');
      res.json(promotions);
    } catch (err) {
      next(err);
    }
  };
}
