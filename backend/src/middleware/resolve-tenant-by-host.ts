import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { TenantResolverService } from '../services/tenant-resolver.service';
import { logger } from '../utils/logger';

/**
 * Cria um middleware Express que resolve o tenant pelo `host` da request,
 * via `TenantResolverService` (que cacheia em Redis).
 *
 * - Sem host na request: 400 `host_required`
 * - Host não corresponde a nenhum tenant: 404 `tenant_not_found`
 * - Tenant resolvido: anexa em `req.tenant` e segue. O
 *   `tenantContextMiddleware` (próximo no pipeline) propaga pro
 *   AsyncLocalStorage.
 *
 * Caller é responsável por excluir rotas que não fazem sentido por host
 * (ex.: `/health`).
 */
export function createResolveTenantByHostMiddleware(
  resolver: TenantResolverService,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const host = req.hostname;
    if (!host) {
      res.status(400).json({ error: 'host_required' });
      return;
    }

    try {
      const tenant = await resolver.resolveByHost(host);
      if (!tenant) {
        res.status(404).json({ error: 'tenant_not_found' });
        return;
      }
      req.tenant = tenant;
      next();
    } catch (err) {
      logger.error('tenant resolution failed', {
        host,
        message: err instanceof Error ? err.message : String(err),
      });
      next(err);
    }
  };
}
