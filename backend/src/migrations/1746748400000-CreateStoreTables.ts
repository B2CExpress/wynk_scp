import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { UuidHelper } from '../utils/uuid-helper';

const schemaName = config.database.schema;

export class CreateStoreTables1746748400000 implements MigrationInterface {
  name = 'CreateStoreTables1746748400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const uuidFn = await UuidHelper.getAvailableUuidFunction(queryRunner);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_category (
        category_id uuid NOT NULL DEFAULT ${uuidFn},
        tenant_id uuid NOT NULL,
        category_slug varchar(140) NOT NULL,
        category_name varchar(120) NOT NULL,
        category_created_at timestamptz NOT NULL DEFAULT now(),
        category_updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tb_category PRIMARY KEY (category_id),
        CONSTRAINT fk_tb_category_tenant FOREIGN KEY (tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_category_tenant_slug ON ${schemaName}.tb_category (tenant_id, category_slug)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_store (
        store_id uuid NOT NULL DEFAULT ${uuidFn},
        tenant_id uuid NOT NULL,
        store_name varchar(120) NOT NULL,
        store_slug varchar(140) NOT NULL,
        store_logo_url text NULL,
        store_cover_image_url text NULL,
        store_floor varchar(40) NULL,
        store_phone varchar(40) NULL,
        store_is_restaurant boolean NOT NULL DEFAULT false,
        store_is_featured boolean NOT NULL DEFAULT false,
        store_status varchar(20) NOT NULL DEFAULT 'active',
        store_sort_order int NOT NULL DEFAULT 0,
        store_created_at timestamptz NOT NULL DEFAULT now(),
        store_updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tb_store PRIMARY KEY (store_id),
        CONSTRAINT fk_tb_store_tenant FOREIGN KEY (tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_store_tenant_slug ON ${schemaName}.tb_store (tenant_id, store_slug)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_store_tenant_status_sort ON ${schemaName}.tb_store (tenant_id, store_status, store_sort_order)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_store_category (
        store_id uuid NOT NULL,
        category_id uuid NOT NULL,
        tenant_id uuid NOT NULL,
        CONSTRAINT pk_tb_store_category PRIMARY KEY (store_id, category_id),
        CONSTRAINT fk_tb_store_category_store FOREIGN KEY (store_id)
          REFERENCES ${schemaName}.tb_store (store_id) ON DELETE CASCADE,
        CONSTRAINT fk_tb_store_category_category FOREIGN KEY (category_id)
          REFERENCES ${schemaName}.tb_category (category_id) ON DELETE CASCADE,
        CONSTRAINT fk_tb_store_category_tenant FOREIGN KEY (tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_store_category_tenant_category ON ${schemaName}.tb_store_category (tenant_id, category_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_store_category_tenant_store ON ${schemaName}.tb_store_category (tenant_id, store_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_store_category`);
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_store`);
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_category`);
  }
}
