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
import { EventRepository } from './repositories/event.repository';
import { TheaterShowRepository } from './repositories/theater-show.repository';
import { TheaterSessionRepository } from './repositories/theater-session.repository';
import { PromotionRepository } from './repositories/promotion.repository';
import { NewsRepository } from './repositories/news.repository';
import { BannerRepository } from './repositories/banner.repository';
import { TenantResolverService } from './services/tenant-resolver.service';
import { AuthService } from './services/auth.service';
import { StoreService } from './services/store.service';
import { EventService } from './services/event.service';
import { TheaterService } from './services/theater.service';
import { PromotionService } from './services/promotion.service';
import { NewsService } from './services/news.service';
import { BannerService } from './services/banner.service';
import { AuthController } from './controllers/auth.controller';
import { StoreController } from './controllers/store.controller';
import { EventController } from './controllers/event.controller';
import { PublicEventController } from './controllers/public-event.controller';
import { TheaterController } from './controllers/theater.controller';
import { PromotionController } from './controllers/promotion.controller';
import { NewsController } from './controllers/news.controller';
import { BannerController } from './controllers/banner.controller';
import { CronController } from './controllers/cron.controller';

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
  const eventRepo = new EventRepository(AppDataSource);
  const theaterShowRepo = new TheaterShowRepository(AppDataSource);
  const theaterSessionRepo = new TheaterSessionRepository(AppDataSource);
  const promotionRepo = new PromotionRepository(AppDataSource);
  const newsRepo = new NewsRepository(AppDataSource);
  const bannerRepo = new BannerRepository(AppDataSource);

  const tenantResolver = new TenantResolverService(tenantRepo, redis);
  const authService = new AuthService(tenantRepo, userRepo, refreshTokenRepo);
  const storeService = new StoreService(storeRepo, redis);
  const eventService = new EventService(eventRepo, redis);
  const theaterService = new TheaterService(theaterShowRepo, theaterSessionRepo, redis);
  const promotionService = new PromotionService(promotionRepo, redis);
  const newsService = new NewsService(newsRepo, redis);
  const bannerService = new BannerService(bannerRepo, redis);
  const authController = new AuthController(authService, userRepo);
  const storeController = new StoreController(storeService);
  const eventController = new EventController(eventService);
  const publicEventController = new PublicEventController(eventService);
  const theaterController = new TheaterController(theaterService);
  const promotionController = new PromotionController(promotionService);
  const newsController = new NewsController(newsService);
  const bannerController = new BannerController(bannerService);
  const cronController = new CronController(newsService);

  const app = createApp({
    tenantResolver,
    authController,
    storeController,
    eventController,
    publicEventController,
    theaterController,
    promotionController,
    newsController,
    bannerController,
    cronController,
  });

  app.listen(config.port, () => {
    logger.info('server listening', { port: config.port, env: config.nodeEnv });
  });
}

void main();
