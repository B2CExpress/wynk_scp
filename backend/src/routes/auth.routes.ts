import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/require-auth';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  // Login: tenant vem da URL (slug), não do Host. Permite domínio único
  // do backoffice (`admin.scp.local/<slug>/login`) sem precisar de subdomínio
  // por tenant.
  router.post('/auth/:slug/login', controller.login);

  // Refresh + logout: tenant vem do cookie de refresh (DB lookup).
  router.post('/auth/refresh', controller.refresh);
  router.post('/auth/logout', controller.logout);

  // Endpoint protegido — exige access cookie válido.
  router.get('/auth/me', requireAuth, controller.me);

  return router;
}
