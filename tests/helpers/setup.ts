import type { Server } from 'node:http';
import { once } from 'node:events';
import { Client } from 'pg';
import Redis from 'ioredis';

const TEST_DB_NAME = process.env.DB_NAME ?? 'scp_test';
const TEST_DB_SCHEMA = process.env.DB_SCHEMA ?? 'scp';
const TEST_REDIS_DB = 15;

type AppModule = typeof import('../../backend/src/app');
type DatabaseModule = typeof import('../../backend/src/config/database');
type TenantEntityModule = typeof import('../../backend/src/entities/Tenant');
type UserEntityModule = typeof import('../../backend/src/entities/User');
type CategoryEntityModule = typeof import('../../backend/src/entities/Category');
type StoreEntityModule = typeof import('../../backend/src/entities/Store');
type StoreCategoryEntityModule = typeof import('../../backend/src/entities/StoreCategory');
type PasswordModule = typeof import('../../backend/src/utils/passwords');
type TenantRepositoryModule = typeof import('../../backend/src/repositories/tenant.repository');
type UserRepositoryModule = typeof import('../../backend/src/repositories/user.repository');
type RefreshTokenRepositoryModule =
  typeof import('../../backend/src/repositories/refresh-token.repository');
type StoreRepositoryModule = typeof import('../../backend/src/repositories/store.repository');
type TenantResolverServiceModule =
  typeof import('../../backend/src/services/tenant-resolver.service');
type AuthServiceModule = typeof import('../../backend/src/services/auth.service');
type StoreServiceModule = typeof import('../../backend/src/services/store.service');
type AuthControllerModule = typeof import('../../backend/src/controllers/auth.controller');
type StoreControllerModule = typeof import('../../backend/src/controllers/store.controller');

export interface TenantFixture {
  id: string;
  slug: string;
  host: string;
  flavorSlug: string;
  name: string;
}

export interface UserFixture {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export interface TenantsSetupResult {
  password: string;
  tenant1: TenantFixture;
  tenant2: TenantFixture;
  admin1: UserFixture;
  admin2: UserFixture;
  superadmin: UserFixture;
}

export interface CategoryFixture {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
}

export interface StoreFixture {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  status: string;
}

export interface IsolationContext {
  baseUrl: string;
  server: Server;
  redis: Redis;
  appModule: AppModule;
  databaseModule: DatabaseModule;
  close: () => Promise<void>;
}

let cachedContext: IsolationContext | null = null;

async function ensureTestDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? '5435'),
    user: process.env.DB_USER ?? 'scp',
    password: process.env.DB_PASS ?? 'scp',
    database: 'postgres',
  });

  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      TEST_DB_NAME,
    ]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    }
  } finally {
    await client.end();
  }
}

async function importBackendModules() {
  const [
    appModule,
    databaseModule,
    tenantRepositoryModule,
    userRepositoryModule,
    refreshTokenRepositoryModule,
    storeRepositoryModule,
    tenantResolverServiceModule,
    authServiceModule,
    storeServiceModule,
    authControllerModule,
    storeControllerModule,
  ] = await Promise.all([
    import('../../backend/src/app'),
    import('../../backend/src/config/database'),
    import('../../backend/src/repositories/tenant.repository'),
    import('../../backend/src/repositories/user.repository'),
    import('../../backend/src/repositories/refresh-token.repository'),
    import('../../backend/src/repositories/store.repository'),
    import('../../backend/src/services/tenant-resolver.service'),
    import('../../backend/src/services/auth.service'),
    import('../../backend/src/services/store.service'),
    import('../../backend/src/controllers/auth.controller'),
    import('../../backend/src/controllers/store.controller'),
  ]);

  return {
    appModule,
    databaseModule,
    tenantRepositoryModule,
    userRepositoryModule,
    refreshTokenRepositoryModule,
    storeRepositoryModule,
    tenantResolverServiceModule,
    authServiceModule,
    storeServiceModule,
    authControllerModule,
    storeControllerModule,
  };
}

export async function createIsolationContext(): Promise<IsolationContext> {
  if (cachedContext) {
    return cachedContext;
  }

  await ensureTestDatabase();

  const modules = await importBackendModules();
  const { AppDataSource } = modules.databaseModule;
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
  }

  const redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? '6382'),
    db: TEST_REDIS_DB,
    maxRetriesPerRequest: 1,
    lazyConnect: false,
  });
  await redis.ping();

  const tenantRepo = new modules.tenantRepositoryModule.TenantRepository(AppDataSource);
  const userRepo = new modules.userRepositoryModule.UserRepository(AppDataSource);
  const refreshTokenRepo = new modules.refreshTokenRepositoryModule.RefreshTokenRepository(
    AppDataSource,
  );
  const storeRepo = new modules.storeRepositoryModule.StoreRepository(AppDataSource);

  const tenantResolver = new modules.tenantResolverServiceModule.TenantResolverService(
    tenantRepo,
    redis,
  );
  const authService = new modules.authServiceModule.AuthService(
    tenantRepo,
    userRepo,
    refreshTokenRepo,
  );
  const storeService = new modules.storeServiceModule.StoreService(storeRepo, redis);
  const authController = new modules.authControllerModule.AuthController(authService, userRepo);
  const storeController = new modules.storeControllerModule.StoreController(storeService);

  const app = modules.appModule.createApp({
    tenantResolver,
    authController,
    storeController,
  });

  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine test server port');
  }

  cachedContext = {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
    redis,
    appModule: modules.appModule,
    databaseModule: modules.databaseModule,
    close: async () => {
      if (cachedContext) {
        await new Promise<void>((resolve, reject) => {
          cachedContext!.server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        await cachedContext.redis.quit();
        if (cachedContext.databaseModule.AppDataSource.isInitialized) {
          await cachedContext.databaseModule.AppDataSource.destroy();
        }
        cachedContext = null;
      }
    },
  };

  return cachedContext;
}

export async function resetIsolationState(): Promise<void> {
  const context = await createIsolationContext();
  const { AppDataSource } = context.databaseModule;

  await context.redis.flushdb();
  await AppDataSource.query(`
    TRUNCATE TABLE
      ${TEST_DB_SCHEMA}.tb_store_category,
      ${TEST_DB_SCHEMA}.tb_store,
      ${TEST_DB_SCHEMA}.tb_category,
      ${TEST_DB_SCHEMA}.tb_refresh_token,
      ${TEST_DB_SCHEMA}.tb_user,
      ${TEST_DB_SCHEMA}.tb_tenant
    RESTART IDENTITY CASCADE
  `);
}

export async function destroyIsolationContext(): Promise<void> {
  if (cachedContext) {
    await cachedContext.close();
  }
}

export async function setupTenants(): Promise<TenantsSetupResult> {
  const context = await createIsolationContext();
  const { AppDataSource } = context.databaseModule;
  const [{ Tenant }, { User }, { hashPassword }] = await Promise.all([
    import('../../backend/src/entities/Tenant') as Promise<TenantEntityModule>,
    import('../../backend/src/entities/User') as Promise<UserEntityModule>,
    import('../../backend/src/utils/passwords') as Promise<PasswordModule>,
  ]);

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const userRepo = AppDataSource.getRepository(User);
  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  const tenant1 = await tenantRepo.save(
    tenantRepo.create({
      slug: 'tenant1',
      host: 'tenant1.local',
      flavorSlug: 'shopping-x',
      name: 'Tenant 1',
    }),
  );
  const tenant2 = await tenantRepo.save(
    tenantRepo.create({
      slug: 'tenant2',
      host: 'tenant2.local',
      flavorSlug: 'shopping-x',
      name: 'Tenant 2',
    }),
  );

  const admin1 = await userRepo.save(
    userRepo.create({
      tenantId: tenant1.id,
      email: 'admin@tenant1.local',
      passwordHash,
      name: 'Admin Tenant 1',
      role: 'tenant_admin',
    }),
  );
  const admin2 = await userRepo.save(
    userRepo.create({
      tenantId: tenant2.id,
      email: 'admin@tenant2.local',
      passwordHash,
      name: 'Admin Tenant 2',
      role: 'tenant_admin',
    }),
  );

  // Compatibilidade com o backlog: o modelo atual nao tem superadmin global.
  // Criamos um usuario com role "superadmin" associado ao tenant1 apenas para
  // fixtures futuras que possam precisar do papel, sem mudar o dominio atual.
  const superadmin = await userRepo.save(
    userRepo.create({
      tenantId: tenant1.id,
      email: 'superadmin@tenant1.local',
      passwordHash,
      name: 'Superadmin Tenant 1',
      role: 'superadmin',
    }),
  );

  return {
    password,
    tenant1: {
      id: tenant1.id,
      slug: tenant1.slug,
      host: tenant1.host,
      flavorSlug: tenant1.flavorSlug,
      name: tenant1.name,
    },
    tenant2: {
      id: tenant2.id,
      slug: tenant2.slug,
      host: tenant2.host,
      flavorSlug: tenant2.flavorSlug,
      name: tenant2.name,
    },
    admin1: {
      id: admin1.id,
      tenantId: admin1.tenantId,
      email: admin1.email,
      name: admin1.name,
      role: admin1.role,
    },
    admin2: {
      id: admin2.id,
      tenantId: admin2.tenantId,
      email: admin2.email,
      name: admin2.name,
      role: admin2.role,
    },
    superadmin: {
      id: superadmin.id,
      tenantId: superadmin.tenantId,
      email: superadmin.email,
      name: superadmin.name,
      role: superadmin.role,
    },
  };
}

export async function createCategoryFixture(input: {
  tenantId: string;
  slug: string;
  name: string;
}): Promise<CategoryFixture> {
  const context = await createIsolationContext();
  const { AppDataSource } = context.databaseModule;
  const { Category } = (await import('../../backend/src/entities/Category')) as CategoryEntityModule;
  const repo = AppDataSource.getRepository(Category);
  const created = await repo.save(
    repo.create({
      tenantId: input.tenantId,
      slug: input.slug,
      name: input.name,
    }),
  );

  return {
    id: created.id,
    tenantId: created.tenantId,
    slug: created.slug,
    name: created.name,
  };
}

export async function createStoreFixture(input: {
  tenantId: string;
  slug: string;
  name: string;
  status?: string;
  categoryIds?: string[];
}): Promise<StoreFixture> {
  const context = await createIsolationContext();
  const { AppDataSource } = context.databaseModule;
  const [{ Store }, { StoreCategory }] = await Promise.all([
    import('../../backend/src/entities/Store') as Promise<StoreEntityModule>,
    import('../../backend/src/entities/StoreCategory') as Promise<StoreCategoryEntityModule>,
  ]);
  const storeRepo = AppDataSource.getRepository(Store);
  const relationRepo = AppDataSource.getRepository(StoreCategory);

  const created = await storeRepo.save(
    storeRepo.create({
      tenantId: input.tenantId,
      slug: input.slug,
      name: input.name,
      status: input.status ?? 'active',
      isRestaurant: false,
      isFeatured: false,
      sortOrder: 0,
      logoUrl: null,
      coverImageUrl: null,
      floor: null,
      phone: null,
    }),
  );

  for (const categoryId of input.categoryIds ?? []) {
    await relationRepo.save(
      relationRepo.create({
        storeId: created.id,
        categoryId,
        tenantId: input.tenantId,
      }),
    );
  }

  return {
    id: created.id,
    tenantId: created.tenantId,
    slug: created.slug,
    name: created.name,
    status: created.status,
  };
}
