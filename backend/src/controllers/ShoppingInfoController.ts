import type { Request, Response } from 'express';
import type { ShoppingInfoService } from '../services/ShoppingInfoService';
import { ShoppingInfoValidationError } from '../services/ShoppingInfoService';
import { requireAuth } from '../middleware/require-auth';
import { requireTenantAdmin } from '../middleware/require-tenant-admin';

export class ShoppingInfoController {
  constructor(private readonly shoppingInfoService: ShoppingInfoService) {}

  /**
   * GET /api/admin/settings/info
   * Roles: tenant_admin, superadmin
   * Retorna {} se nunca preenchido (não 404).
   */
  async getInfo(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const data = await this.shoppingInfoService.getByTenantId(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'internal_server_error' });
    }
  }

  /**
   * PUT /api/admin/settings/info
   * Roles: tenant_admin, superadmin
   * Faz UPSERT. Retorna { ok: true, updated_at }.
   */
  async updateInfo(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const result = await this.shoppingInfoService.upsert(tenantId, req.body);
      res.json(result);
    } catch (err) {
      if (err instanceof ShoppingInfoValidationError) {
        res.status(400).json({ errors: err.errors });
        return;
      }
      res.status(500).json({ error: 'internal_server_error' });
    }
  }
}