import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { redis } from './config/redis';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { TenantRepository } from './repositories/tenant.repository';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { TenantResolverService } from './services/tenant-resolver.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

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

  const tenantResolver = new TenantResolverService(tenantRepo, redis);
  const authService = new AuthService(tenantRepo, userRepo, refreshTokenRepo);
  const authController = new AuthController(authService, userRepo);

  const app = createApp({ tenantResolver, authController });

  app.listen(config.port, () => {
    logger.info('server listening', { port: config.port, env: config.nodeEnv });
  });
}

void main();
