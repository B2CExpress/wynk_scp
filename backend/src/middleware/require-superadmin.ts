import type { NextFunction, Request, Response } from 'express';

/**
 * Gate de autorização do papel `superadmin` (global, sem tenant) — SPEC-20260603-1149.
 *
 * Espelha `require-tenant-admin.ts`, mas aceita SOMENTE `superadmin`. Diferente do
 * Tenant Admin, o superadmin opera cross-tenant (provisiona/gerencia shoppings), então
 * `tenant_admin`/`admin`/`editor` recebem 403 aqui — não há herança de privilégio.
 *
 * Pressupõe `requireAuth` já executado (popula `req.user`). Use sempre em par:
 *   router.use(requireAuth, requireSuperadmin)
 */
export function requireSuperadmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  next();
}
