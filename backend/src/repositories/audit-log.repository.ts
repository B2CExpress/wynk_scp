import type { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../entities/AuditLog';

export interface AuditListParams {
  eventType?: string;
  actorId?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export class AuditLogRepository {
  private readonly dataSource: DataSource;
  private readonly auditRepo: Repository<AuditLog>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.auditRepo = dataSource.getRepository(AuditLog);
  }

  async log(input: {
    eventType: string;
    actorUserId: string;
    actorRole: string;
    targetTenantId?: string | null;
    targetUserId?: string | null;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<AuditLog> {
    const log = this.auditRepo.create({
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      targetTenantId: input.targetTenantId ?? null,
      targetUserId: input.targetUserId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return this.auditRepo.save(log);
  }

  async list(params: AuditListParams): Promise<{ data: AuditLog[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const offset = (page - 1) * limit;

    let query = this.auditRepo
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.actor', 'actor')
      .leftJoinAndSelect('audit.targetTenant', 'tenant');

    if (params.eventType) {
      query = query.andWhere('audit.event_type = :eventType', { eventType: params.eventType });
    }

    if (params.actorId) {
      query = query.andWhere('audit.actor_user_id = :actorId', { actorId: params.actorId });
    }

    if (params.tenantId) {
      query = query.andWhere('audit.target_tenant_id = :tenantId', { tenantId: params.tenantId });
    }

    const data = await query.orderBy('audit.created_at', 'DESC').skip(offset).take(limit).getMany();

    const total = await query.getCount();

    return { data, total };
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditRepo
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.actor', 'actor')
      .leftJoinAndSelect('audit.targetTenant', 'tenant')
      .where('audit.audit_id = :id', { id })
      .getOne();
  }
}
