import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { UuidHelper } from '../utils/uuid-helper';

const schemaName = config.database.schema;

export class CreateRefreshTokenTable1746748300000 implements MigrationInterface {
  name = 'CreateRefreshTokenTable1746748300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const uuidFn = await UuidHelper.getAvailableUuidFunction(queryRunner);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_refresh_token (
        token_id uuid NOT NULL DEFAULT ${uuidFn},
        user_id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        token_hash varchar(64) NOT NULL,
        token_expires_at timestamptz NOT NULL,
        token_revoked_at timestamptz NULL,
        token_created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tb_refresh_token PRIMARY KEY (token_id),
        CONSTRAINT fk_tb_refresh_token_user_id FOREIGN KEY (user_id)
          REFERENCES ${schemaName}.tb_user (user_id) ON DELETE CASCADE,
        CONSTRAINT fk_tb_refresh_token_tenant_id FOREIGN KEY (tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id) ON DELETE CASCADE,
        CONSTRAINT uq_tb_refresh_token_hash UNIQUE (token_hash)
      )
    `);

    // Lookup secundário em "todos os tokens de um user" — usado em logout-all
    // e nos checks de double-use de refresh rotativo.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_refresh_token_user_id ON ${schemaName}.tb_refresh_token (user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_refresh_token`);
  }
}
