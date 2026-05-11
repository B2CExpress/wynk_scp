import type { Request, Response } from 'express';
import type { TenantResolverService } from '../../src/services/tenant-resolver.service';
import type { TenantContext } from '../../src/middleware/tenant-context';
import type { AuthController } from '../../src/controllers/auth.controller';
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

/**
 * Stub do `AuthController` que responde 501 em todas as rotas. Usado por
 * testes que não exercitam auth — evita instanciar AuthService + repos reais.
 */
export function makeStubAuthController(): AuthController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    login: notImplemented,
    refresh: notImplemented,
    logout: notImplemented,
    me: notImplemented,
  } as unknown as AuthController;
}

export function makeAppDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tenantResolver: makeFakeTenantResolver(),
    authController: makeStubAuthController(),
    ...overrides,
  };
}
