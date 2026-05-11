/**
 * Wrapper standalone para o TypeORM CLI.
 *
 * Padrão alinhado com wynk_ecommerce/backend/typeorm.config.ts: re-exporta o
 * `AppDataSource` num arquivo na raiz do projeto pra facilitar comandos como
 * `typeorm-ts-node-commonjs migration:run -d typeorm.config.ts`.
 */
import { AppDataSource } from './src/config/database';

export default AppDataSource;
