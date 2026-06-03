import type { DataSource, EntityTarget } from 'typeorm';
import { Tenant } from '../entities/Tenant';
import { User } from '../entities/User';
import { Store } from '../entities/Store';
import { News } from '../entities/News';
import { hashPassword } from '../utils/passwords';
import { invalidateTenantCache } from './tenant-resolver.service';
import { logger } from '../utils/logger';

/**
 * SuperadminTenantService — provisionamento e ciclo de vida de tenants (SPEC-20260603-1149).
 *
 * Opera FORA de contexto de tenant (superadmin é cross-tenant): recebe o `DataSource`
 * direto — e não os wrappers de repository tenant-scoped — porque (1) o create é uma
 * transação multi-tabela (tenant + admin inicial) e (2) a listagem agrega contagens de
 * outras tabelas. O `TenantSubscriber` isenta a entity `Tenant`, e o admin é inserido
 * com `tenantId` explícito, então nenhum INSERT é bloqueado mesmo sem `runWithTenantContext`.
 *
 * Branding NÃO entra aqui: criação referencia `flavorSlug` (Modelo A, build-time),
 * nunca cores. Respostas em snake_case seguindo o contrato do SQU-72.
 */
export type TenantStatus = 'active' | 'trial' | 'inactive' | 'suspended';

export interface CreateTenantInput {
  name: string;
  slug: string;
  host: string;
  status?: TenantStatus;
  flavorSlug?: string;
  adminEmail: string;
  adminPassword: string;
  adminName?: string;
}

export interface UpdateTenantInput {
  name?: string;
  host?: string;
  status?: TenantStatus;
}

export interface ListTenantsQuery {
  status?: TenantStatus;
  page?: number;
  limit?: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  host: string;
  status: TenantStatus;
  stores_count: number;
  posts_count: number;
  created_at: Date;
}

export interface ListTenantsResponse {
  data: TenantListItem[];
  total: number;
}

export interface CreateTenantResponse {
  id: string;
  name: string;
  slug: string;
  host: string;
  status: TenantStatus;
  admin_user_id: string;
  created_at: Date;
}

const DEFAULT_FLAVOR_SLUG = 'default';
const DEFAULT_STATUS: TenantStatus = 'trial';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const PG_UNIQUE_VIOLATION = '23505';

export class SlugConflictError extends Error {
  constructor() {
    super('slug_already_taken');
  }
}

export class HostConflictError extends Error {
  constructor() {
    super('host_already_taken');
  }
}

export class TenantNotFoundError extends Error {
  constructor() {
    super('tenant_not_found');
  }
}

/** Retorna o nome da constraint violada se for unique violation (23505), senão null. */
function uniqueViolationConstraint(err: unknown): string | null {
  const e = err as {
    code?: string;
    constraint?: string;
    driverError?: { code?: string; constraint?: string };
  };
  const code = e?.code ?? e?.driverError?.code;
  if (code !== PG_UNIQUE_VIOLATION) {
    return null;
  }
  return e?.constraint ?? e?.driverError?.constraint ?? '';
}

export class SuperadminTenantService {
  constructor(private readonly dataSource: DataSource) {}

  async list(query: ListTenantsQuery): Promise<ListTenantsResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? DEFAULT_LIMIT));

    const qb = this.dataSource
      .getRepository(Tenant)
      .createQueryBuilder('t')
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.where('t.status = :status', { status: query.status });
    }

    const [tenants, total] = await qb.getManyAndCount();
    const ids = tenants.map((t) => t.id);

    // 2 agregações (não N+1): contagens por tenant da página atual.
    const [storeCounts, postCounts] = await Promise.all([
      this.countByTenant(Store, ids),
      this.countByTenant(News, ids), // decisão SPEC: posts_count = notícias
    ]);

    const data: TenantListItem[] = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      host: t.host,
      status: t.status,
      stores_count: storeCounts.get(t.id) ?? 0,
      posts_count: postCounts.get(t.id) ?? 0,
      created_at: t.createdAt,
    }));

    return { data, total };
  }

  private async countByTenant(
    entity: EntityTarget<{ tenantId: string }>,
    tenantIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (tenantIds.length === 0) {
      return counts;
    }

    const rows = await this.dataSource
      .getRepository(entity)
      .createQueryBuilder('e')
      .select('e.tenantId', 'tenantId')
      .addSelect('COUNT(*)', 'count')
      .where('e.tenantId IN (:...tenantIds)', { tenantIds })
      .groupBy('e.tenantId')
      .getRawMany<{ tenantId: string; count: string }>();

    for (const row of rows) {
      counts.set(row.tenantId, Number.parseInt(row.count, 10));
    }
    return counts;
  }

  /**
   * Cria tenant + usuário admin inicial em UMA transação. Pré-checa unicidade de
   * slug/host (mensagem amigável) e também captura a unique violation do banco
   * (corrida entre o check e o insert).
   */
  async createWithAdmin(
    input: CreateTenantInput,
    actorUserId: string,
  ): Promise<CreateTenantResponse> {
    const repo = this.dataSource.getRepository(Tenant);
    if (await repo.findOne({ where: { slug: input.slug } })) {
      throw new SlugConflictError();
    }
    if (await repo.findOne({ where: { host: input.host } })) {
      throw new HostConflictError();
    }

    const passwordHash = await hashPassword(input.adminPassword);

    let response: CreateTenantResponse;
    try {
      response = await this.dataSource.transaction(async (manager) => {
        const tenant = manager.create(Tenant, {
          name: input.name,
          slug: input.slug,
          host: input.host,
          flavorSlug: input.flavorSlug ?? DEFAULT_FLAVOR_SLUG,
          status: input.status ?? DEFAULT_STATUS,
          deletedAt: null,
        });
        const savedTenant = await manager.save(tenant);

        const admin = manager.create(User, {
          tenantId: savedTenant.id,
          email: input.adminEmail,
          passwordHash,
          name: input.adminName ?? 'Administrador',
          role: 'tenant_admin',
        });
        const savedAdmin = await manager.save(admin);

        return {
          id: savedTenant.id,
          name: savedTenant.name,
          slug: savedTenant.slug,
          host: savedTenant.host,
          status: savedTenant.status,
          admin_user_id: savedAdmin.id,
          created_at: savedTenant.createdAt,
        };
      });
    } catch (err) {
      const constraint = uniqueViolationConstraint(err);
      if (constraint === 'uq_tb_tenant_slug') {
        throw new SlugConflictError();
      }
      if (constraint === 'uq_tb_tenant_host') {
        throw new HostConflictError();
      }
      throw err;
    }

    logger.info('tenant_created', {
      actor: actorUserId,
      tenant_id: response.id,
      slug: response.slug,
      host: response.host,
    });
    return response;
  }

  async update(
    id: string,
    patch: UpdateTenantInput,
    actorUserId: string,
  ): Promise<{ ok: true; updated_at: Date }> {
    const repo = this.dataSource.getRepository(Tenant);
    const tenant = await repo.findOne({ where: { id } });
    if (!tenant) {
      throw new TenantNotFoundError();
    }

    const oldHost = tenant.host;
    if (patch.host !== undefined && patch.host !== tenant.host) {
      const clash = await repo.findOne({ where: { host: patch.host } });
      if (clash && clash.id !== id) {
        throw new HostConflictError();
      }
      tenant.host = patch.host;
    }
    if (patch.name !== undefined) {
      tenant.name = patch.name;
    }
    if (patch.status !== undefined) {
      tenant.status = patch.status;
    }

    try {
      await repo.save(tenant);
    } catch (err) {
      if (uniqueViolationConstraint(err) === 'uq_tb_tenant_host') {
        throw new HostConflictError();
      }
      throw err;
    }

    // Resolução por host é cacheada — invalida host antigo (e o novo, se mudou).
    await invalidateTenantCache(oldHost);
    if (tenant.host !== oldHost) {
      await invalidateTenantCache(tenant.host);
    }

    logger.info('tenant_updated', { actor: actorUserId, tenant_id: id });
    return { ok: true, updated_at: tenant.updatedAt };
  }

  /**
   * Soft-delete: marca `inactive`, libera o host original (renomeia para
   * `deleted-<id>.local`) e seta `deletedAt`. Dados permanecem para auditoria.
   */
  async softDelete(
    id: string,
    actorUserId: string,
  ): Promise<{ ok: true; soft_deleted: true }> {
    const repo = this.dataSource.getRepository(Tenant);
    const tenant = await repo.findOne({ where: { id } });
    if (!tenant) {
      throw new TenantNotFoundError();
    }

    const originalHost = tenant.host;
    tenant.status = 'inactive';
    tenant.host = `deleted-${id}.local`;
    tenant.deletedAt = new Date();
    await repo.save(tenant);

    await invalidateTenantCache(originalHost);

    logger.info('tenant_soft_deleted', { actor: actorUserId, tenant_id: id });
    return { ok: true, soft_deleted: true };
  }
}
