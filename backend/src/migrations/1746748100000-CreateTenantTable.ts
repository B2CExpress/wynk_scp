import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { UuidHelper } from '../utils/uuid-helper';

const schemaName = config.database.schema;

export class CreateTenantTable1746748100000 implements MigrationInterface {
  name = 'CreateTenantTable1746748100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const uuidFn = await UuidHelper.getAvailableUuidFunction(queryRunner);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_tenant (
        tenant_id uuid NOT NULL DEFAULT ${uuidFn},
        tenant_slug varchar(64) NOT NULL,
        tenant_host varchar(255) NOT NULL,
        tenant_flavor_slug varchar(64) NOT NULL,
        tenant_name varchar(255) NOT NULL,
        tenant_created_at timestamptz NOT NULL DEFAULT now(),
        tenant_updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tb_tenant PRIMARY KEY (tenant_id),
        CONSTRAINT uq_tb_tenant_slug UNIQUE (tenant_slug),
        CONSTRAINT uq_tb_tenant_host UNIQUE (tenant_host)
      )
    `);

    // Índice por flavor_slug pra validação CI eficiente (busca todos os flavors em uso)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_tenant_flavor_slug ON ${schemaName}.tb_tenant (tenant_flavor_slug)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_tenant`);
  }
}
