import { Router } from 'express';
import type { TheaterController } from '../controllers/theater.controller';
import { requireAuth } from '../middleware/require-auth';

export function createTheaterRoutes(controller: TheaterController): Router {
  const router = Router();

  // Theater shows
  router.get('/api/admin/theater-shows/:id', requireAuth, controller.getShowById);
  router.post('/api/admin/theater-shows', requireAuth, controller.createShow);
  router.put('/api/admin/theater-shows/:id', requireAuth, controller.updateShow);
  router.delete('/api/admin/theater-shows/:id', requireAuth, controller.deleteShow);
  router.post('/api/admin/theater-shows/:id/publish', requireAuth, controller.publishShow);

  // Theater sessions
  router.post('/api/admin/theater-shows/:id/sessions', requireAuth, controller.addSession);
  router.put('/api/admin/theater-sessions/:id', requireAuth, controller.updateSession);
  router.delete('/api/admin/theater-sessions/:id', requireAuth, controller.deleteSession);

  return router;
}
