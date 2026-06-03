import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt';
import { runWithTenantContext, type TenantContext } from './tenant-context';

export const ACCESS_COOKIE = 'scp_access';
export const REFRESH_COOKIE = 'scp_refresh';

/**
 * `req.user` populado pelo `requireAuth` após validar o access JWT.
 * Carrega o necessário pro controller decidir autorização sem mais consultas.
 */
export interface AuthedUser {
  userId: string;
  /** `null` para o papel `superadmin` (global, sem tenant) — SPEC-20260603-1149. */
  tenantId: string | null;
  role: string;
}

/**
 * Middleware que exige access cookie válido. Em sucesso:
 *   - popula `req.user` com identidade do operador
 *   - popula `req.tenant` com `TenantContext` derivado do JWT
 *   - encadeia `next()` dentro de `runWithTenantContext` (subscriber TypeORM
 *     enxerga o tenantId em qualquer INSERT/UPDATE downstream)
 *
 * Falha → 401 `unauthorized`. Não distingue "sem cookie" de "JWT expirado"
 * pra não dar pista de enumeração; cliente faz refresh ou re-login.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const token = cookies[ACCESS_COOKIE];
  if (!token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    throw err;
  }

  (req as Request & { user?: AuthedUser }).user = {
    userId: payload.sub,
    tenantId: payload.tenantId ?? null,
    role: payload.role,
  };

  // Superadmin (SPEC-20260603-1149) opera fora de contexto de tenant: autentica
  // mas NÃO abre `runWithTenantContext`, senão o `TenantSubscriber` rejeitaria
  // operações cross-tenant (ex.: provisionar um tenant + seu admin).
  if (payload.role === 'superadmin' || !payload.tenantId) {
    next();
    return;
  }

  const tenantCtx: TenantContext = {
    tenantId: payload.tenantId,
    slug: payload.tenantSlug ?? '',
    flavorSlug: payload.tenantFlavorSlug ?? '',
  };

  req.tenant = tenantCtx;
  runWithTenantContext(tenantCtx, () => next());
}
