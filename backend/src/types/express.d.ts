import type { TenantContext } from '../middleware/tenant-context';
import type { AuthedUser } from '../middleware/require-auth';

/**
 * Aumenta `Express.Request`:
 *   - `req.tenant` é populado pelo `resolveTenantByHostMiddleware` (rotas
 *     com host-based) ou pelo `requireAuth` (rotas com JWT).
 *   - `req.user` é populado apenas pelo `requireAuth` em rotas protegidas.
 */
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: AuthedUser;
    }
  }
}

export {};
