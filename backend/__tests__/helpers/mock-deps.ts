import type { Request, Response } from 'express';
import type { TenantResolverService } from '../../src/services/tenant-resolver.service';
import type { TenantContext } from '../../src/middleware/tenant-context';
import type { AuthController } from '../../src/controllers/auth.controller';
import type { StoreController } from '../../src/controllers/store.controller';
import type { EventController } from '../../src/controllers/event.controller';
import type { PublicEventController } from '../../src/controllers/public-event.controller';
import type { TheaterController } from '../../src/controllers/theater.controller';
import type { PromotionController } from '../../src/controllers/promotion.controller';
import type { PublicPromotionController } from '../../src/controllers/public-promotion.controller';
import type { StoreCategoryController } from '../../src/controllers/store-category.controller';
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

/**
 * Stub do `StoreController` que responde 501. Usado por testes que não
 * exercitam stores — evita montar service + repository + Redis.
 */
export function makeStubStoreController(): StoreController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    list: notImplemented,
    detail: notImplemented,
    createAdmin: notImplemented,
    updateAdmin: notImplemented,
  } as unknown as StoreController;
}

/**
 * Stub do `EventController` que responde 501. Usado por testes que não
 * exercitam events.
 */
export function makeStubEventController(): EventController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    getById: notImplemented,
    create: notImplemented,
    update: notImplemented,
    delete: notImplemented,
    publish: notImplemented,
  } as unknown as EventController;
}

/**
 * Stub do `TheaterController` que responde 501. Usado por testes que não
 * exercitam theater.
 */
export function makeStubTheaterController(): TheaterController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    getShowById: notImplemented,
    createShow: notImplemented,
    updateShow: notImplemented,
    deleteShow: notImplemented,
    publishShow: notImplemented,
    addSession: notImplemented,
    updateSession: notImplemented,
    deleteSession: notImplemented,
  } as unknown as TheaterController;
}

export function makeStubPromotionController(): PromotionController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    list: notImplemented,
    getById: notImplemented,
    create: notImplemented,
    update: notImplemented,
    delete: notImplemented,
    publish: notImplemented,
    archive: notImplemented,
  } as unknown as PromotionController;
}

/**
 * Stub do `PublicEventController` que responde 501. Usado por testes que não
 * exercitam public events.
 */
export function makeStubPublicEventController(): PublicEventController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    listPublished: notImplemented,
    getBySlugPublished: notImplemented,
  } as unknown as PublicEventController;
}

/**
 * Stub do `PublicPromotionController` que responde 501. Usado por testes que
 * não exercitam public promotions.
 */
export function makeStubPublicPromotionController(): PublicPromotionController {
  const notImplemented = async (_req: Request, res: Response): Promise<void> => {
    res.status(501).json({ error: 'not_implemented_in_test' });
  };
  return {
    listPublished: notImplemented,
  } as unknown as PublicPromotionController;
}

export function makeAppDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    tenantResolver: makeFakeTenantResolver(),
    authController: makeStubAuthController(),
    storeController: makeStubStoreController(),
    eventController: makeStubEventController(),
    publicEventController: makeStubPublicEventController(),
    theaterController: makeStubTheaterController(),
    promotionController: makeStubPromotionController(),
    publicPromotionController: makeStubPublicPromotionController(),
    storeCategoryController: undefined as StoreCategoryController | undefined,
    ...overrides,
  };
}
