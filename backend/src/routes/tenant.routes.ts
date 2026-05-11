import { Router } from 'express';
import { getTenantResolve } from '../controllers/tenant.controller';

/**
 * Rotas de tenant resolution. O middleware de host resolution é aplicado
 * globalmente em `app.ts` antes deste router (com bypass pra `/health`),
 * então quando chega aqui, `req.tenant` já está populado.
 */
export const tenantRoutes = Router();

tenantRoutes.get('/tenant/resolve', getTenantResolve);
