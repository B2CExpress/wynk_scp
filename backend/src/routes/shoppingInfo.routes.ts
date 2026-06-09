import { Router } from 'express';
import type { ShoppingInfoController } from '../controllers/ShoppingInfoController';
import { requireAuth } from '../middleware/require-auth';
import { requireTenantAdmin } from '../middleware/require-tenant-admin';

export function createShoppingInfoRoutes(controller: ShoppingInfoController): Router {
  const router = Router();

  router.get(
    '/api/admin/settings/info',
    requireAuth,
    requireTenantAdmin,
    (req, res) => controller.getInfo(req, res),
  );

  router.put(
    '/api/admin/settings/info',
    requireAuth,
    requireTenantAdmin,
    (req, res) => controller.updateInfo(req, res),
  );

  return router;
}