import { Router } from 'express';
import type { EventController } from '../controllers/event.controller';
import { requireAuth } from '../middleware/require-auth';

export function createEventRoutes(controller: EventController): Router {
  const router = Router();

  router.get('/api/admin/events/:id', requireAuth, controller.getById);
  router.post('/api/admin/events', requireAuth, controller.create);
  router.put('/api/admin/events/:id', requireAuth, controller.update);
  router.delete('/api/admin/events/:id', requireAuth, controller.delete);
  router.post('/api/admin/events/:id/publish', requireAuth, controller.publish);

  return router;
}
