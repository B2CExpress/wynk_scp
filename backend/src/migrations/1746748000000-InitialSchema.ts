import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';

const schemaName = config.database.schema;

/**
 * Migration inicial: cria o schema dedicado da plataforma + habilita
 * extensão `pgcrypto` pra ter `gen_random_uuid()` disponível.
 *
 * Idempotente: pode ser rodada múltiplas vezes sem efeito colateral.
 */
export class InitialSchema1746748000000 implements MigrationInterface {
  name = 'InitialSchema1746748000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Não dropamos a extensão pgcrypto — pode ser usada por outros schemas/tenants.
    // Não dropamos o schema — operação destrutiva, exige decisão consciente.
    await queryRunner.query(`-- noop: schema and extension preserved on rollback`);
  }
}
