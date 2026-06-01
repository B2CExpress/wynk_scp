import { Router } from 'express';
import type { AdminDashboardController } from '../controllers/admin-dashboard.controller';
import { requireAuth } from '../middleware/require-auth';

export function createAdminDashboardRoutes(controller: AdminDashboardController): Router {
  const router = Router();
  router.get('/api/admin/dashboard/metrics', requireAuth, controller.getMetrics);
  return router;
}
