import type { TenantContext } from '../middleware/tenant-context';

/**
 * Aumenta `Express.Request` com `req.tenant`, populado pelo middleware
 * `resolveTenantByHostMiddleware` antes do `tenantContextMiddleware`.
 *
 * Sem populado: rota não passou por resolução de host (ex.: /health).
 */
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

export {};
