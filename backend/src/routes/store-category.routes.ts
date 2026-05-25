import { Router } from 'express';
import type { StoreCategoryController } from '../controllers/store-category.controller';
import { requireAuth } from '../middleware/require-auth';
import { requireTenantAdmin } from '../middleware/require-tenant-admin';

export function createStoreCategoryRoutes(controller?: StoreCategoryController): Router {
  const router = Router();

  if (!controller) {
    return router;
  }

  router.get('/api/v1/store-categories', controller.listPublic);
  router.get('/api/admin/store-categories', requireAuth, requireTenantAdmin, controller.listAdmin);
  router.post(
    '/api/admin/store-categories',
    requireAuth,
    requireTenantAdmin,
    controller.createAdmin,
  );
  router.put(
    '/api/admin/store-categories/:id',
    requireAuth,
    requireTenantAdmin,
    controller.updateAdmin,
  );
  router.delete(
    '/api/admin/store-categories/:id',
    requireAuth,
    requireTenantAdmin,
    controller.deleteAdmin,
  );
  router.post(
    '/api/admin/store-categories/reorder',
    requireAuth,
    requireTenantAdmin,
    controller.reorderAdmin,
  );

  return router;
}
