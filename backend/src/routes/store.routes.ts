import { Router } from 'express';
import type { StoreController } from '../controllers/store.controller';
import { requireAuth } from '../middleware/require-auth';
import { requireTenantAdmin } from '../middleware/require-tenant-admin';

export function createStoreRoutes(controller: StoreController): Router {
  const router = Router();
  router.get('/api/v1/stores', controller.list);
  router.get('/api/v1/stores/:slug', controller.detail);

  if (
    controller.listAdmin &&
    controller.getDetailAdmin &&
    controller.createAdmin &&
    controller.updateAdmin &&
    controller.deleteAdmin
  ) {
    router.get('/api/admin/stores', requireAuth, requireTenantAdmin, controller.listAdmin);
    router.get('/api/admin/stores/:id', requireAuth, requireTenantAdmin, controller.getDetailAdmin);
    router.post('/api/admin/stores', requireAuth, requireTenantAdmin, controller.createAdmin);
    router.put('/api/admin/stores/:id', requireAuth, requireTenantAdmin, controller.updateAdmin);
    router.delete('/api/admin/stores/:id', requireAuth, requireTenantAdmin, controller.deleteAdmin);
  }

  return router;
}
