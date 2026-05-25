import { Router } from 'express';
import type { PromotionController } from '../controllers/promotion.controller';
import { requireAuth } from '../middleware/require-auth';

export function createPromotionRoutes(controller: PromotionController): Router {
  const router = Router();

  router.get('/api/admin/promotions', requireAuth, controller.list);
  router.get('/api/admin/promotions/:id', requireAuth, controller.getById);
  router.post('/api/admin/promotions', requireAuth, controller.create);
  router.put('/api/admin/promotions/:id', requireAuth, controller.update);
  router.delete('/api/admin/promotions/:id', requireAuth, controller.delete);
  router.post('/api/admin/promotions/:id/publish', requireAuth, controller.publish);
  router.post('/api/admin/promotions/:id/archive', requireAuth, controller.archive);

  return router;
}
