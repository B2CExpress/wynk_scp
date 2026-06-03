import type { Request, Response } from 'express';
import { validateCreateTenant, validateUpdateTenant } from '../utils/tenantValidator';
import {
  SuperadminTenantService,
  SlugConflictError,
  HostConflictError,
  TenantNotFoundError,
  type TenantStatus,
} from '../services/superadmin-tenant.service';
import { logger } from '../utils/logger';

/**
 * Controller do CRUD de tenants do Superadmin (SPEC-20260603-1149).
 *
 * Pressupõe `requireAuth` + `requireSuperadmin` nas rotas — então `req.user`
 * existe e tem `role === 'superadmin'`. O `actor` dos logs de auditoria vem de
 * `req.user.userId`. Respostas em snake_case conforme o contrato SQU-72.
 *
 * Trata TODO erro internamente (convenção do projeto: handlers async não
 * propagam para o error middleware do Express) — conhecidos viram 4xx, o resto 500.
 */
export class SuperadminTenantController {
  constructor(private readonly service: SuperadminTenantService) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as TenantStatus | undefined;
      const page = Number.parseInt(req.query.page as string, 10);
      const limit = Number.parseInt(req.query.limit as string, 10);

      const result = await this.service.list({
        status: status || undefined,
        page: Number.isNaN(page) ? undefined : page,
        limit: Number.isNaN(limit) ? undefined : limit,
      });
      res.json(result);
    } catch (err) {
      this.fail(res, err, 'list');
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    const { isValid, errors } = validateCreateTenant(req.body);
    if (!isValid) {
      res.status(400).json({ error: 'validation_failed', errors });
      return;
    }

    try {
      const created = await this.service.createWithAdmin(
        {
          name: req.body.name,
          slug: req.body.slug,
          host: req.body.host,
          status: req.body.status,
          flavorSlug: req.body.flavor_slug,
          adminEmail: req.body.admin_email,
          adminPassword: req.body.admin_password,
          adminName: req.body.admin_name,
        },
        req.user!.userId,
      );
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof SlugConflictError) {
        res.status(409).json({ error: 'slug_already_taken' });
        return;
      }
      if (err instanceof HostConflictError) {
        res.status(409).json({ error: 'host_already_taken' });
        return;
      }
      this.fail(res, err, 'create');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { isValid, errors } = validateUpdateTenant(req.body);
    if (!isValid) {
      res.status(400).json({ error: 'validation_failed', errors });
      return;
    }

    try {
      const result = await this.service.update(
        req.params.id,
        { name: req.body.name, host: req.body.host, status: req.body.status },
        req.user!.userId,
      );
      res.json(result);
    } catch (err) {
      if (err instanceof TenantNotFoundError) {
        res.status(404).json({ error: 'tenant_not_found' });
        return;
      }
      if (err instanceof HostConflictError) {
        res.status(409).json({ error: 'host_already_taken' });
        return;
      }
      this.fail(res, err, 'update');
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.softDelete(req.params.id, req.user!.userId);
      res.json(result);
    } catch (err) {
      if (err instanceof TenantNotFoundError) {
        res.status(404).json({ error: 'tenant_not_found' });
        return;
      }
      this.fail(res, err, 'remove');
    }
  }

  private fail(res: Response, err: unknown, op: string): void {
    logger.error('superadmin tenant operation failed', {
      op,
      message: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'internal_error' });
  }
}
