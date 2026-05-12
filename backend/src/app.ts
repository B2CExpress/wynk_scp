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
import { createResolveTenantByHostMiddleware } from './middleware/resolve-tenant-by-host';
import { tenantContextMiddleware } from './middleware/tenant-context';
import { tenantRoutes } from './routes/tenant.routes';
import { createAuthRoutes } from './routes/auth.routes';
import { createStoreRoutes } from './routes/store.routes';

export interface AppDeps {
  tenantResolver: TenantResolverService;
  authController: AuthController;
  storeController: StoreController;
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
