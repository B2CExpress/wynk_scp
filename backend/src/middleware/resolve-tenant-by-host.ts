import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { TenantResolverService } from '../services/tenant-resolver.service';
import { logger } from '../utils/logger';
import type { AuthedUser } from './require-auth';
import type { TenantRepository } from '../repositories/tenant.repository';

/**
 * Cria um middleware Express que resolve o tenant pela impersonação ou pelo `host`.
 *
 * Pseudocodigo (SPEC-SQU-73):
 * 1. Se `user` existe E `user.role == 'superadmin'`:
 *    a. Ler `impersonate_tenant_id` do cookie
 *    b. Se existe: buscar tenant pelo ID (checa status='active')
 *    c. Se tenant válido: anexar em `req.tenant` e seguir
 * 2. Caso padrão (não-superadmin OU sem cookie de impersonação):
 *    a. Resolver tenant pelo `host` (comportamento Fase 1)
 *
 * Sem host na request (se caindo no path padrão): 400 `host_required`
 * Host não corresponde a nenhum tenant: 404 `tenant_not_found`
 * Tenant resolvido: anexa em `req.tenant` e segue.
 */
export function createResolveTenantByHostMiddleware(
  resolver: TenantResolverService,
  tenantRepo?: TenantRepository,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authed = (req as Request & { user?: AuthedUser }).user;
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};

    // Checar impersonação (apenas para superadmin)
    if (authed && authed.role === 'superadmin' && tenantRepo) {
      const impersonateId = cookies['impersonate_tenant_id'];
      if (impersonateId) {
        try {
          const tenant = await tenantRepo.findById(impersonateId);
          if (tenant && tenant.status === 'active') {
            // Montar contexto de tenant a partir da entidade
            req.tenant = {
              tenantId: tenant.id,
              slug: tenant.slug,
              flavorSlug: tenant.flavorSlug,
            };
            logger.info('tenant resolved via impersonation', {
              tenantId: impersonateId,
              actorId: authed.userId,
            });
            next();
            return;
          }
        } catch (err) {
          logger.warn('impersonation tenant resolution failed', {
            impersonateId,
            message: err instanceof Error ? err.message : String(err),
          });
          // Cair para resolução padrão
        }
      }
    }

    // Resolver tenant pelo host (comportamento padrão Fase 1)
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
