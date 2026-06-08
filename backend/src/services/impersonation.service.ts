import type { Request, Response } from 'express';
import type { TenantRepository } from '../repositories/tenant.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import type { DataSource } from 'typeorm';
import { logger } from '../utils/logger';

const IMPERSONATE_COOKIE_NAME = 'impersonate_tenant_id';
const IMPERSONATE_TTL_SECONDS = 4 * 60 * 60; // 4 horas

export interface ImpersonationContext {
  isImpersonating: boolean;
  impersonatedTenantId?: string;
}

export class ImpersonationService {
  private readonly tenantRepo: TenantRepository;
  private readonly auditLogRepo: AuditLogRepository;

  constructor(dataSource: DataSource, tenantRepo: TenantRepository) {
    this.tenantRepo = tenantRepo;
    this.auditLogRepo = new AuditLogRepository(dataSource);
  }

  /**
   * Inicia impersonação de um tenant.
   * - Valida que o tenant existe e está ativo
   * - Seta cookie de impersonação
   * - Cria entrada de audit log
   * - Retorna URL de redirecionamento
   */
  async start(
    actorId: string,
    actorRole: string,
    tenantId: string,
    req: Request,
    res: Response,
  ): Promise<{ ok: true; redirect_url: string }> {
    // Buscar tenant alvo
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) {
      throw new Error('tenant_not_found');
    }

    if (tenant.status !== 'active') {
      throw new Error('tenant_not_active');
    }

    // Setar cookie de impersonação
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: IMPERSONATE_TTL_SECONDS * 1000,
    };

    res.cookie(IMPERSONATE_COOKIE_NAME, tenantId, cookieOptions);

    // Registrar no audit log
    await this.auditLogRepo.log({
      eventType: 'impersonate_start',
      actorUserId: actorId,
      actorRole,
      targetTenantId: tenantId,
      metadata: {
        from_url: req.headers.referer ?? null,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    logger.info('impersonation started', {
      actorId,
      tenantId,
      tenantName: tenant.name,
    });

    return {
      ok: true,
      redirect_url: `https://${tenant.host}/admin`,
    };
  }

  /**
   * Encerra impersonação.
   * - Limpa cookie
   * - Cria entrada de audit log
   * - Retorna URL de redirecionamento
   */
  async stop(
    actorId: string,
    actorRole: string,
    req: Request,
    res: Response,
  ): Promise<{ ok: true; redirect_url: string }> {
    // Buscar tenant que está sendo impersonado (antes de limpar)
    const impersonatedTenantId = this.getImpersonatedTenantId(req);

    // Limpar cookie
    res.clearCookie(IMPERSONATE_COOKIE_NAME, {
      path: '/',
    });

    // Registrar no audit log
    if (impersonatedTenantId) {
      await this.auditLogRepo.log({
        eventType: 'impersonate_stop',
        actorUserId: actorId,
        actorRole,
        targetTenantId: impersonatedTenantId,
        metadata: null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });

      logger.info('impersonation stopped', {
        actorId,
        tenantId: impersonatedTenantId,
      });
    }

    return {
      ok: true,
      redirect_url: '/admin/tenants',
    };
  }

  /**
   * Checa se está impersonando e retorna o ID do tenant
   */
  getImpersonatedTenantId(req: Request): string | null {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
    return cookies[IMPERSONATE_COOKIE_NAME] ?? null;
  }

  /**
   * Checa se está atualmente impersonando
   */
  isImpersonating(req: Request): boolean {
    return this.getImpersonatedTenantId(req) !== null;
  }
}
