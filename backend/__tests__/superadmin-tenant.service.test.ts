import type { DataSource } from 'typeorm';
import { Tenant } from '../src/entities/Tenant';
import {
  SuperadminTenantService,
  SlugConflictError,
  HostConflictError,
  TenantNotFoundError,
} from '../src/services/superadmin-tenant.service';

// Isola do Redis: invalidação de cache vira spy.
jest.mock('../src/services/tenant-resolver.service', () => ({
  invalidateTenantCache: jest.fn(async () => undefined),
}));
import { invalidateTenantCache } from '../src/services/tenant-resolver.service';

const invalidateMock = invalidateTenantCache as jest.MockedFunction<typeof invalidateTenantCache>;

interface FakeState {
  tenantsBySlug: Map<string, Partial<Tenant>>;
  tenantsByHost: Map<string, Partial<Tenant>>;
  tenantsById: Map<string, Partial<Tenant>>;
  saved: Array<Record<string, unknown>>;
}

/**
 * DataSource fake mínimo: cobre os caminhos usados pelo service (findOne por
 * slug/host/id, transaction com manager.create/save). Sem DB real (convenção
 * do projeto: mocks no boundary).
 */
function makeFakeDataSource(state: FakeState): DataSource {
  const tenantRepo = {
    findOne: async ({ where }: { where: Record<string, string> }) => {
      if ('slug' in where) return state.tenantsBySlug.get(where.slug) ?? null;
      if ('host' in where) return state.tenantsByHost.get(where.host) ?? null;
      if ('id' in where) return state.tenantsById.get(where.id) ?? null;
      return null;
    },
    save: async (entity: Record<string, unknown>) => {
      state.saved.push(entity);
      return entity;
    },
  };

  const manager = {
    create: (_entity: unknown, data: Record<string, unknown>) => ({ ...data }),
    save: async (entity: Record<string, unknown>) => {
      const withId = {
        ...entity,
        id: entity.id ?? `gen-${state.saved.length}`,
        createdAt: entity.createdAt ?? new Date(),
      };
      state.saved.push(withId);
      return withId;
    },
  };

  return {
    getRepository: () => tenantRepo,
    transaction: async (cb: (m: typeof manager) => Promise<unknown>) => cb(manager),
  } as unknown as DataSource;
}

function emptyState(): FakeState {
  return {
    tenantsBySlug: new Map(),
    tenantsByHost: new Map(),
    tenantsById: new Map(),
    saved: [],
  };
}

const INPUT = {
  name: 'Shopping Novo',
  slug: 'shopping-novo',
  host: 'shoppingnovo.com.br',
  adminEmail: 'admin@shoppingnovo.com.br',
  adminPassword: 'TempPassword123!',
};

beforeEach(() => invalidateMock.mockClear());

describe('SuperadminTenantService.createWithAdmin', () => {
  it('cria tenant + admin e retorna id do admin (transação)', async () => {
    const state = emptyState();
    const service = new SuperadminTenantService(makeFakeDataSource(state));

    const result = await service.createWithAdmin(INPUT, 'actor-1');

    expect(result.slug).toBe('shopping-novo');
    expect(result.status).toBe('trial'); // default
    expect(result.admin_user_id).toBeTruthy();
    // Tenant + User salvos dentro da transação.
    expect(state.saved.length).toBe(2);
  });

  it('lança SlugConflictError se slug já existe (pré-check)', async () => {
    const state = emptyState();
    state.tenantsBySlug.set('shopping-novo', { id: 't1' });
    const service = new SuperadminTenantService(makeFakeDataSource(state));

    await expect(service.createWithAdmin(INPUT, 'actor-1')).rejects.toBeInstanceOf(
      SlugConflictError,
    );
    expect(state.saved.length).toBe(0); // nada persistido
  });

  it('lança HostConflictError se host já existe (pré-check)', async () => {
    const state = emptyState();
    state.tenantsByHost.set('shoppingnovo.com.br', { id: 't1' });
    const service = new SuperadminTenantService(makeFakeDataSource(state));

    await expect(service.createWithAdmin(INPUT, 'actor-1')).rejects.toBeInstanceOf(
      HostConflictError,
    );
  });
});

describe('SuperadminTenantService.update', () => {
  it('404 quando tenant não existe', async () => {
    const service = new SuperadminTenantService(makeFakeDataSource(emptyState()));
    await expect(service.update('missing', { name: 'X' }, 'actor')).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
  });

  it('atualiza e invalida cache do host antigo e do novo', async () => {
    const state = emptyState();
    const existing: Partial<Tenant> = {
      id: 't1',
      slug: 's',
      host: 'antigo.com.br',
      status: 'active',
    };
    state.tenantsById.set('t1', existing);
    const service = new SuperadminTenantService(makeFakeDataSource(state));

    const res = await service.update('t1', { host: 'novo.com.br' }, 'actor');

    expect(res.ok).toBe(true);
    expect(invalidateMock).toHaveBeenCalledWith('antigo.com.br');
    expect(invalidateMock).toHaveBeenCalledWith('novo.com.br');
  });

  it('HostConflictError quando o novo host pertence a outro tenant', async () => {
    const state = emptyState();
    state.tenantsById.set('t1', { id: 't1', host: 'antigo.com.br' });
    state.tenantsByHost.set('novo.com.br', { id: 't2', host: 'novo.com.br' });
    const service = new SuperadminTenantService(makeFakeDataSource(state));

    await expect(
      service.update('t1', { host: 'novo.com.br' }, 'actor'),
    ).rejects.toBeInstanceOf(HostConflictError);
  });
});

describe('SuperadminTenantService.softDelete', () => {
  it('404 quando tenant não existe', async () => {
    const service = new SuperadminTenantService(makeFakeDataSource(emptyState()));
    await expect(service.softDelete('missing', 'actor')).rejects.toBeInstanceOf(
      TenantNotFoundError,
    );
  });

  it('marca inactive, libera host e seta deletedAt; invalida cache do host original', async () => {
    const state = emptyState();
    const existing: Partial<Tenant> = {
      id: 't1',
      host: 'original.com.br',
      status: 'active',
      deletedAt: null,
    };
    state.tenantsById.set('t1', existing);
    const service = new SuperadminTenantService(makeFakeDataSource(state));

    const res = await service.softDelete('t1', 'actor');

    expect(res).toEqual({ ok: true, soft_deleted: true });
    expect(existing.status).toBe('inactive');
    expect(existing.host).toBe('deleted-t1.local');
    expect(existing.deletedAt).toBeInstanceOf(Date);
    expect(invalidateMock).toHaveBeenCalledWith('original.com.br');
  });
});
