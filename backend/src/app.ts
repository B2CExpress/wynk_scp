import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './utils/logger';
import type { TenantResolverService } from './services/tenant-resolver.service';
import type { AuthController } from './controllers/auth.controller';
import type { StoreController } from './controllers/store.controller';
import type { EventController } from './controllers/event.controller';
import type { PublicEventController } from './controllers/public-event.controller';
import type { TheaterController } from './controllers/theater.controller';
import type { PromotionController } from './controllers/promotion.controller';
import type { NewsController } from './controllers/news.controller';
import type { BannerController } from './controllers/banner.controller';
import type { PopupController } from './controllers/popup.controller';
import type { HeroController } from './controllers/hero.controller';
import type { CronController } from './controllers/cron.controller';
import type { AdminDashboardController } from './controllers/admin-dashboard.controller';
import type { PublicPromotionController } from './controllers/public-promotion.controller';
import type { StoreCategoryController } from './controllers/store-category.controller';
import type { SuperadminTenantController } from './controllers/superadminTenantController';
import { createResolveTenantByHostMiddleware } from './middleware/resolve-tenant-by-host';
import { tenantContextMiddleware } from './middleware/tenant-context';
import { tenantRoutes } from './routes/tenant.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createStoreRoutes } from './routes/store.routes';
import { createEventRoutes } from './routes/event.routes';
import { createTheaterRoutes } from './routes/theater.routes';
import { createPromotionRoutes } from './routes/promotion.routes';
import { createNewsRoutes } from './routes/news.routes';
import { createBannerRoutes } from './routes/banner.routes';
import { createPopupRoutes } from './routes/popup.routes';
import { createHeroRoutes } from './routes/hero.routes';
import { createCronRoutes } from './routes/cron.routes';
import { createAdminDashboardRoutes } from './routes/admin-dashboard.routes';
import { createStoreCategoryRoutes } from './routes/store-category.routes';
import { createSuperadminRoutes } from './routes/superadmin.routes';

export interface AppDeps {
  tenantResolver: TenantResolverService;
  authController: AuthController;
  storeController: StoreController;
  eventController: EventController;
  publicEventController: PublicEventController;
  theaterController: TheaterController;
  promotionController: PromotionController;
  newsController: NewsController;
  bannerController: BannerController;
  popupController: PopupController;
  heroController: HeroController;
  dashboardController: AdminDashboardController;
  cronController: CronController;
  publicPromotionController: PublicPromotionController;
  storeCategoryController?: StoreCategoryController;
  superadminTenantController: SuperadminTenantController;
}

/**
 * Caminhos que NÃO passam por resolução de tenant pelo host.
 *
 * - `/health` → healthcheck precisa responder sem DB/Redis.
 * - `/auth/*` → tenant vem da URL (login) ou do JWT (refresh/logout/me),
 *   não do `Host`. O backoffice roda em domínio único (ex.: `admin.scp.local`)
 *   que naturalmente não casa com nenhum `tenant_host`.
 */
function shouldBypassTenantResolution(path: string): boolean {
  return path === '/health' || path === '/auth' || path.startsWith('/auth/');
}

function bypassFor(check: (path: string) => boolean, handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (check(req.path)) {
      return next();
    }
    return handler(req, res, next);
  };
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  // Confiar no proxy reverso pra `req.hostname` refletir o `Host` original.
  // Em prod, vai estar atrás de Nginx/CloudFlare; em dev/test, idempotente.
  app.set('trust proxy', true);

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/api', createSuperadminRoutes(deps.superadminTenantController));

  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  // Health endpoint — usado por Docker, Kubernetes e CI smoke test.
  // Vem ANTES do middleware de tenant pra responder mesmo sem DB.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Pipeline multitenant: resolve host → propaga ctx → rotas.
  // Rotas `/auth/*` bypassam a resolução por host (tenant vem da URL/JWT).
  app.use(
    bypassFor(
      shouldBypassTenantResolution,
      createResolveTenantByHostMiddleware(deps.tenantResolver),
    ),
  );
  app.use(bypassFor(shouldBypassTenantResolution, tenantContextMiddleware));

  app.use(tenantRoutes);
  app.use(createAuthRoutes(deps.authController));
  app.use(createStoreRoutes(deps.storeController));
  app.use(createEventRoutes(deps.eventController, deps.publicEventController));
  app.use(createTheaterRoutes(deps.theaterController));
  app.use(createPromotionRoutes(deps.promotionController, deps.publicPromotionController));
  app.use(createStoreCategoryRoutes(deps.storeCategoryController));
  app.use(createNewsRoutes(deps.newsController));
  app.use(createBannerRoutes(deps.bannerController));
  app.use(createPopupRoutes(deps.popupController));
  app.use(createHeroRoutes(deps.heroController));
  app.use(createAdminDashboardRoutes(deps.dashboardController));
  app.use(createCronRoutes(deps.cronController));

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'not_found' });
  });

  // Error handler — última linha de defesa
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'internal_server_error' });
  });

  return app;
}
