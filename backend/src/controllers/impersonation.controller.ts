import type { Request, Response } from 'express';
import { ImpersonationService } from '../services/impersonation.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import type { DataSource } from 'typeorm';
import type { AuthedUser } from '../middleware/require-auth';

export class ImpersonationController {
  private readonly impersonationService: ImpersonationService;
  private readonly auditLogRepo: AuditLogRepository;

  constructor(
    private readonly dataSource: DataSource,
    impersonationService: ImpersonationService,
  ) {
    this.impersonationService = impersonationService;
    this.auditLogRepo = new AuditLogRepository(dataSource);
  }

  start = async (req: Request, res: Response): Promise<void> => {
    const authed = (req as Request & { user?: AuthedUser }).user;

    // 401: não autenticado
    if (!authed) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    // 403: não é superadmin
    if (authed.role !== 'superadmin') {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { tenant_id } = (req.body ?? {}) as { tenant_id?: string };

    // 400: body inválido
    if (!tenant_id) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    try {
      const result = await this.impersonationService.start(
        authed.userId,
        authed.role,
        tenant_id,
        req,
        res,
      );
      res.status(200).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (message === 'tenant_not_found') {
        res.status(404).json({ error: 'tenant_not_found' });
        return;
      }

      if (message === 'tenant_not_active') {
        res.status(404).json({ error: 'tenant_not_active' });
        return;
      }

      throw err;
    }
  };

  stop = async (req: Request, res: Response): Promise<void> => {
    const authed = (req as Request & { user?: AuthedUser }).user;

    // 401: não autenticado
    if (!authed) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const result = await this.impersonationService.stop(authed.userId, authed.role, req, res);
    res.status(200).json(result);
  };

  getAuditLog = async (req: Request, res: Response): Promise<void> => {
    const authed = (req as Request & { user?: AuthedUser }).user;

    // 401: não autenticado
    if (!authed) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    // 403: não é superadmin
    if (authed.role !== 'superadmin') {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const eventType = (req.query.event_type as string) ?? undefined;
    const actorId = (req.query.actor_id as string) ?? undefined;
    const tenantId = (req.query.tenant_id as string) ?? undefined;
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '50', 10);

    const { data, total } = await this.auditLogRepo.list({
      eventType,
      actorId,
      tenantId,
      page,
      limit,
    });

    // Serializar resposta
    const formattedData = data.map((log) => ({
      id: log.id,
      event_type: log.eventType,
      actor: {
        id: log.actor?.id,
        email: log.actor?.email,
        role: log.actorRole,
      },
      target_tenant: log.targetTenant
        ? {
            id: log.targetTenant.id,
            name: log.targetTenant.name,
          }
        : null,
      metadata: log.metadata,
      ip_address: log.ipAddress,
      created_at: log.createdAt.toISOString(),
    }));

    res.status(200).json({
      data: formattedData,
      total,
      page,
    });
  };
}
