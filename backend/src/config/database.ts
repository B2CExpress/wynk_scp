import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from './index';
import { Tenant } from '../entities/Tenant';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';

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
  entities: [Tenant, User, RefreshToken],
  migrations: [
    config.nodeEnv === 'production' ? 'dist/migrations/**/*.js' : 'src/migrations/**/*.{ts,js}',
  ],
  subscribers: [
    config.nodeEnv === 'production' ? 'dist/subscribers/**/*.js' : 'src/subscribers/**/*.{ts,js}',
  ],
});
