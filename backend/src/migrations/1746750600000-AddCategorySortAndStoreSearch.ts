import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';

const schemaName = config.database.schema;

export class AddCategorySortAndStoreSearch1746750600000 implements MigrationInterface {
  name = 'AddCategorySortAndStoreSearch1746750600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_category
      ADD COLUMN IF NOT EXISTS category_sort_order int NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_store
      ADD COLUMN IF NOT EXISTS store_search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(store_name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(store_description, '')), 'B')
      ) STORED
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS ix_tb_store_search_vector
      ON ${schemaName}.tb_store
      USING GIN (store_search_vector)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS ix_tb_category_tenant_sort
      ON ${schemaName}.tb_category (tenant_id, category_sort_order, category_name)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS ${schemaName}.ix_tb_category_tenant_sort`);
    await queryRunner.query(`DROP INDEX IF EXISTS ${schemaName}.ix_tb_store_search_vector`);
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_store
      DROP COLUMN IF EXISTS store_search_vector
    `);
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_category
      DROP COLUMN IF EXISTS category_sort_order
    `);
  }
}
