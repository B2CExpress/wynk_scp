import { Router } from 'express';
import type { PopupController } from '../controllers/popup.controller';
import { requireAuth } from '../middleware/require-auth';

export function createPopupRoutes(controller: PopupController): Router {
  const router = Router();

  // Public Route (Client-facing)
  router.get('/api/v1/popups/active', (req, res) => controller.getPublicPopup(req, res));

  // Admin Routes (Protected)
  router.get('/api/admin/popups', requireAuth, (req, res) => controller.listPopups(req, res));
  router.get('/api/admin/popups/:id', requireAuth, (req, res) => controller.getPopup(req, res));

  router.post('/api/admin/popups', requireAuth, (req, res) => controller.createPopup(req, res));
  router.put('/api/admin/popups/:id', requireAuth, (req, res) => controller.updatePopup(req, res));
  router.delete('/api/admin/popups/:id', requireAuth, (req, res) =>
    controller.deletePopup(req, res),
  );

  router.post('/api/admin/popups/:id/activate', requireAuth, (req, res) =>
    controller.activatePopup(req, res),
  );
  router.post('/api/admin/popups/:id/deactivate', requireAuth, (req, res) =>
    controller.deactivatePopup(req, res),
  );

  return router;
}
