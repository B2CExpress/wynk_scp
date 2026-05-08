import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { redis } from './config/redis';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { TenantRepository } from './repositories/tenant.repository';
import { TenantResolverService } from './services/tenant-resolver.service';

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
  const tenantResolver = new TenantResolverService(tenantRepo, redis);

  const app = createApp({ tenantResolver });

  app.listen(config.port, () => {
    logger.info('server listening', { port: config.port, env: config.nodeEnv });
  });
}

void main();
