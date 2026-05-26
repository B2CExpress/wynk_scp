import { Router } from 'express';
import type { BannerController } from '../controllers/banner.controller';
import { requireAuth } from '../middleware/require-auth';

export function createBannerRoutes(controller: BannerController): Router {
  const router = Router();

  // Admin routes
  router.get('/api/admin/banners', requireAuth, (req, res) => controller.listBanners(req, res));
  router.post('/api/admin/banners', requireAuth, (req, res) => controller.createBanner(req, res));
  router.get('/api/admin/banners/:id', requireAuth, (req, res) => controller.getBanner(req, res));
  router.put('/api/admin/banners/:id', requireAuth, (req, res) => controller.updateBanner(req, res));
  router.delete('/api/admin/banners/:id', requireAuth, (req, res) =>
    controller.deleteBanner(req, res),
  );
  router.post('/api/admin/banners/reorder', requireAuth, (req, res) =>
    controller.reorderBanners(req, res),
  );
  router.post('/api/admin/banners/:id/toggle', requireAuth, (req, res) =>
    controller.toggleBanner(req, res),
  );

  return router;
}
