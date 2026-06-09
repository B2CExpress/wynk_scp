import 'reflect-metadata';
import * as path from 'node:path';
import { DataSource } from 'typeorm';
import { config } from './index';
import { Tenant } from '../entities/Tenant';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { Store } from '../entities/Store';
import { Category } from '../entities/Category';
import { StoreCategory } from '../entities/StoreCategory';
import { Event } from '../entities/Event';
import { TheaterShow } from '../entities/TheaterShow';
import { TheaterSession } from '../entities/TheaterSession';
import { Promotion } from '../entities/Promotion';
import { News } from '../entities/News';
import { Banner } from '../entities/Banner';

//Novo import 
import { ShoppingInfo } from '../entities/ShoppingInfo';

// Resolve globs de migrations/subscribers absolutos ao próprio módulo, não ao
// CWD. Necessário pra Vitest da raiz (`npm run test:isolation`) achar os mesmos
// arquivos que o Jest/CLI do backend acham.
const BACKEND_SRC = path.resolve(__dirname, '..');
const MIGRATIONS_GLOB =
  config.nodeEnv === 'production'
    ? path.join(BACKEND_SRC.replace(/\/src$/, '/dist'), 'migrations', '**', '*.js')
    : path.join(BACKEND_SRC, 'migrations', '**', '*.{ts,js}');
const SUBSCRIBERS_GLOB =
  config.nodeEnv === 'production'
    ? path.join(BACKEND_SRC.replace(/\/src$/, '/dist'), 'subscribers', '**', '*.js')
    : path.join(BACKEND_SRC, 'subscribers', '**', '*.{ts,js}');

/**
 * AppDataSource — instância única do TypeORM compartilhada por toda a aplicação.
 *
 * Padrão alinhado com wynk_ecommerce/backend/src/config/database.ts.
 *
 * - `synchronize: false` — schema é gerenciado por migrations (sem auto-sync).
 * - `entities` lista explícita: cada entity nova é importada e adicionada aqui (não usar glob).
 * - `migrations` aponta pra src em dev e dist em prod.
 * - `subscribers` aponta pra src/subscribers/*.ts.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  schema: config.database.schema,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    Tenant,
    User,
    RefreshToken,
    Store,
    Category,
    StoreCategory,
    Event,
    TheaterShow,
    TheaterSession,
    Promotion,
    News,
    Banner,
    ShoppingInfo,
  ],
  migrations: [MIGRATIONS_GLOB],
  subscribers: [SUBSCRIBERS_GLOB],
});
