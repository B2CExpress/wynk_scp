import { Router } from 'express';
import type { EventController } from '../controllers/event.controller';
import type { PublicEventController } from '../controllers/public-event.controller';
import { requireAuth } from '../middleware/require-auth';

export function createEventRoutes(
  controller: EventController,
  publicController: PublicEventController,
): Router {
  const router = Router();

  // Public routes
  router.get('/api/v1/events', publicController.listPublished);
  router.get('/api/v1/events/:slug', publicController.getBySlugPublished);

  // Admin routes
  router.get('/api/admin/events/:id', requireAuth, controller.getById);
  router.post('/api/admin/events', requireAuth, controller.create);
  router.put('/api/admin/events/:id', requireAuth, controller.update);
  router.delete('/api/admin/events/:id', requireAuth, controller.delete);
  router.post('/api/admin/events/:id/publish', requireAuth, controller.publish);

  return router;
}
