import type { NextFunction, Request, Response } from 'express';

const ADMIN_ROLES = new Set(['tenant_admin', 'admin']);

export function requireTenantAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !ADMIN_ROLES.has(req.user.role)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  next();
}
