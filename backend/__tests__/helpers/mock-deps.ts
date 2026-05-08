import type { TenantResolverService } from '../../src/services/tenant-resolver.service';
import type { TenantContext } from '../../src/middleware/tenant-context';
import type { AppDeps } from '../../src/app';

/**
 * Fake do `TenantResolverService` pra testes. Lê de um Map host→ctx em vez
 * de tocar Redis ou Postgres.
 */
export function makeFakeTenantResolver(
  tenantsByHost: Map<string, TenantContext> = new Map(),
): TenantResolverService {
  return {
    async resolveByHost(host: string) {
      return tenantsByHost.get(host) ?? null;
    },
    async invalidate(host: string) {
      tenantsByHost.delete(host);
    },
  } as unknown as TenantResolverService;
}

export function makeAppDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tenantResolver: makeFakeTenantResolver(),
    ...overrides,
  };
}
