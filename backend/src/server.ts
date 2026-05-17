import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { redis } from './config/redis';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { TenantRepository } from './repositories/tenant.repository';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { StoreRepository } from './repositories/store.repository';
import { StoreCategoryRepository } from './repositories/store-category.repository';
import { TenantResolverService } from './services/tenant-resolver.service';
import { AuthService } from './services/auth.service';
import { StoreService } from './services/store.service';
import { AuthController } from './controllers/auth.controller';
import { StoreController } from './controllers/store.controller';
import { StoreCategoryService } from './services/store-category.service';
import { StoreCategoryController } from './controllers/store-category.controller';

async function main(): Promise<void> {
  // Inicialização do banco e Redis fica opt-in pra ambiente: em dev/prod conectamos,
  // em testes preferimos test containers ou mocks.
  if (config.nodeEnv !== 'test') {
    try {
      await AppDataSource.initialize();
      logger.info('database connected', {
        host: config.database.host,
        database: config.database.database,
        schema: config.database.schema,
      });
    } catch (err) {
      logger.error('database connection failed', {
        message: err instanceof Error ? err.message : String(err),
      });
      process.exit(1);
    }
  }

  const tenantRepo = new TenantRepository(AppDataSource);
  const userRepo = new UserRepository(AppDataSource);
  const refreshTokenRepo = new RefreshTokenRepository(AppDataSource);
  const storeRepo = new StoreRepository(AppDataSource);
  const storeCategoryRepo = new StoreCategoryRepository(AppDataSource);

  const tenantResolver = new TenantResolverService(tenantRepo, redis);
  const authService = new AuthService(tenantRepo, userRepo, refreshTokenRepo);
  const storeService = new StoreService(storeRepo, redis);
  const storeCategoryService = new StoreCategoryService(storeCategoryRepo);
  const authController = new AuthController(authService, userRepo);
  const storeController = new StoreController(storeService);
  const storeCategoryController = new StoreCategoryController(storeCategoryService);

  const app = createApp({
    tenantResolver,
    authController,
    storeController,
    storeCategoryController,
  });

  app.listen(config.port, () => {
    logger.info('server listening', { port: config.port, env: config.nodeEnv });
  });
}

void main();
