import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { UuidHelper } from '../utils/uuid-helper';

const schemaName = config.database.schema;

export class CreatePromotionTable1746748500000 implements MigrationInterface {
  name = 'CreatePromotionTable1746748500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const uuidFn = await UuidHelper.getAvailableUuidFunction(queryRunner);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_promotion (
        promotion_id uuid NOT NULL DEFAULT ${uuidFn},
        tenant_id uuid NOT NULL,
        store_id uuid NOT NULL,
        promotion_title varchar(200) NOT NULL,
        promotion_slug varchar(250) NOT NULL,
        promotion_description text NOT NULL,
        promotion_image_url text NULL,
        promotion_discount_label varchar(50) NOT NULL,
        promotion_valid_from timestamptz NOT NULL,
        promotion_valid_until timestamptz NOT NULL,
        promotion_status varchar(20) NOT NULL DEFAULT 'draft',
        promotion_published_at timestamptz NULL,
        promotion_created_at timestamptz NOT NULL DEFAULT now(),
        promotion_updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT pk_tb_promotion PRIMARY KEY (promotion_id),
        CONSTRAINT fk_tb_promotion_tenant FOREIGN KEY (tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id) ON DELETE CASCADE,
        CONSTRAINT fk_tb_promotion_store FOREIGN KEY (store_id)
          REFERENCES ${schemaName}.tb_store (store_id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_promotion_tenant_slug ON ${schemaName}.tb_promotion (tenant_id, promotion_slug)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_promotion_tenant_store ON ${schemaName}.tb_promotion (tenant_id, store_id)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_promotion_tenant_status_published ON ${schemaName}.tb_promotion (tenant_id, promotion_status, promotion_published_at)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_tb_promotion_tenant_valid_until ON ${schemaName}.tb_promotion (tenant_id, promotion_valid_until)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_promotion`);
  }
}
