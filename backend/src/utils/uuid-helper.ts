import { QueryRunner } from 'typeorm';

/**
 * Helper que detecta qual função de geração de UUID está disponível no
 * Postgres em runtime. Adaptado de wynk_ecommerce/backend/src/utils/uuid-helper.ts.
 *
 * Ordem de preferência:
 *   1. uuid_generate_v4()  — extensão `uuid-ossp`, mais portável
 *   2. gen_random_uuid()   — built-in em PG 13+ (extensão `pgcrypto` em versões mais antigas)
 *
 * Cacheia o resultado pra não consultar o catálogo a cada migration.
 */
export class UuidHelper {
  private static cachedUuidFunction: string | null = null;

  static async getAvailableUuidFunction(queryRunner: QueryRunner): Promise<string> {
    if (this.cachedUuidFunction) {
      return this.cachedUuidFunction;
    }

    const uuidOsspExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'uuid_generate_v4'
      ) AS exists
    `);
    if (uuidOsspExists[0]?.exists) {
      this.cachedUuidFunction = 'uuid_generate_v4()';
      return this.cachedUuidFunction;
    }

    const genRandomExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'gen_random_uuid'
      ) AS exists
    `);
    if (genRandomExists[0]?.exists) {
      this.cachedUuidFunction = 'gen_random_uuid()';
      return this.cachedUuidFunction;
    }

    throw new Error(
      'Nenhuma função de UUID disponível. Habilite a extensão `pgcrypto` (PG 13+) ou `uuid-ossp`.',
    );
  }

  static resetCache(): void {
    this.cachedUuidFunction = null;
  }
}
