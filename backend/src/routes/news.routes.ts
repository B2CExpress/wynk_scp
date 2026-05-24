import { Router } from 'express';
import type { NewsController } from '../controllers/news.controller';
import { requireAuth } from '../middleware/require-auth';

export function createNewsRoutes(controller: NewsController): Router {
  const router = Router();

  // Admin routes
  router.get('/api/admin/news', requireAuth, (req, res) => controller.listNews(req, res));
  router.post('/api/admin/news', requireAuth, (req, res) => controller.createNews(req, res));
  router.get('/api/admin/news/:id', requireAuth, (req, res) => controller.getNews(req, res));
  router.put('/api/admin/news/:id', requireAuth, (req, res) => controller.updateNews(req, res));
  router.delete('/api/admin/news/:id', requireAuth, (req, res) => controller.deleteNews(req, res));
  router.post('/api/admin/news/:id/publish', requireAuth, (req, res) =>
    controller.publishNews(req, res),
  );
  router.post('/api/admin/news/:id/archive', requireAuth, (req, res) =>
    controller.archiveNews(req, res),
  );

  return router;
}
