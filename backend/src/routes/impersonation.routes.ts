import { Router } from 'express';
import type { ImpersonationController } from '../controllers/impersonation.controller';
import { requireAuth } from '../middleware/require-auth';
import { requireSuperadmin } from '../middleware/require-superadmin';

/**
 * Rotas de impersonação e auditoria (SPEC-SQU-73).
 *
 * - POST /superadmin/impersonate: inicia impersonação
 * - POST /superadmin/impersonate/stop: encerra impersonação
 * - GET /admin/audit: lista logs de auditoria
 *
 * Todas exigem autenticação + superadmin (exceto /audit que valida no controller).
 */
export function createImpersonationRoutes(controller: ImpersonationController): Router {
  const router = Router();

  const guards = [requireAuth, requireSuperadmin];

  router.post('/superadmin/impersonate', ...guards, (req, res) => controller.start(req, res));
  router.post('/superadmin/impersonate/stop', requireAuth, (req, res) =>
    controller.stop(req, res),
  );
  router.get('/admin/audit', ...guards, (req, res) => controller.getAuditLog(req, res));

  return router;
}
