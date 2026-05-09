import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { UuidHelper } from '../utils/uuid-helper';

const schemaName = config.database.schema;

export class CreateUserTable1746748200000 implements MigrationInterface {
  name = 'CreateUserTable1746748200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const uuidFn = await UuidHelper.getAvailableUuidFunction(queryRunner);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_user (
        user_id uuid NOT NULL DEFAULT ${uuidFn},
        tenant_id uuid NOT NULL,
        user_email varchar(255) NOT NULL,
        user_password_hash varchar(255) NOT NULL,
        user_name varchar(255) NOT NULL,
        user_role varchar(50) NOT NULL DEFAULT 'tenant_admin',
        user_created_at timestamptz NOT NULL DEFAULT now(),
        user_updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tb_user PRIMARY KEY (user_id),
        CONSTRAINT fk_tb_user_tenant_id FOREIGN KEY (tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id) ON DELETE CASCADE,
        CONSTRAINT uq_tb_user_tenant_email UNIQUE (tenant_id, user_email)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_user`);
  }
}
