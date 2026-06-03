import { Router } from 'express';
import type { SuperadminTenantController } from '../controllers/superadminTenantController';
import { requireAuth } from '../middleware/require-auth';
import { requireSuperadmin } from '../middleware/require-superadmin';

/**
 * Rotas do CRUD de tenants do Superadmin (SPEC-20260603-1149). Montadas sob `/api`
 * no `app.ts`, ANTES da resolução de tenant por host — superadmin opera cross-tenant.
 *
 * Todas exigem `requireAuth` + `requireSuperadmin` (papel `superadmin`; Tenant Admin/
 * Editor → 403).
 */
export function createSuperadminRoutes(controller: SuperadminTenantController): Router {
  const router = Router();

  const guards = [requireAuth, requireSuperadmin];

  router.get('/superadmin/tenants', ...guards, (req, res) => controller.list(req, res));
  router.post('/superadmin/tenants', ...guards, (req, res) => controller.create(req, res));
  router.put('/superadmin/tenants/:id', ...guards, (req, res) => controller.update(req, res));
  router.delete('/superadmin/tenants/:id', ...guards, (req, res) => controller.remove(req, res));

  return router;
}
