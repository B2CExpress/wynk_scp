import { Router } from 'express';
import type { StoreController } from '../controllers/store.controller';

export function createStoreRoutes(controller: StoreController): Router {
  const router = Router();
  router.get('/api/v1/stores', controller.list);
  return router;
}
