import { Router } from 'express';
import type { PromotionController } from '../controllers/promotion.controller';
import type { PublicPromotionController } from '../controllers/public-promotion.controller';
import { requireAuth } from '../middleware/require-auth';

export function createPromotionRoutes(
  controller: PromotionController,
  publicController: PublicPromotionController,
): Router {
  const router = Router();

  // Public routes
  router.get('/api/v1/promotions', publicController.listPublished);

  // Admin routes
  router.get('/api/admin/promotions', requireAuth, controller.list);
  router.get('/api/admin/promotions/:id', requireAuth, controller.getById);
  router.post('/api/admin/promotions', requireAuth, controller.create);
  router.put('/api/admin/promotions/:id', requireAuth, controller.update);
  router.delete('/api/admin/promotions/:id', requireAuth, controller.delete);
  router.post('/api/admin/promotions/:id/publish', requireAuth, controller.publish);
  router.post('/api/admin/promotions/:id/archive', requireAuth, controller.archive);

  return router;
}
