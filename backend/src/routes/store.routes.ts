import { Router } from 'express';
import type { StoreController } from '../controllers/store.controller';
import { requireAuth } from '../middleware/require-auth';

export function createStoreRoutes(controller: StoreController): Router {
  const router = Router();
  router.get('/api/v1/stores', controller.list);
  router.get('/api/v1/stores/:slug', controller.detail);
  router.post('/api/admin/stores', requireAuth, controller.createAdmin);
  router.put('/api/admin/stores/:id', requireAuth, controller.updateAdmin);
  return router;
}
