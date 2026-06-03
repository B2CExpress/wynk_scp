import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';

const schemaName = config.database.schema;

/**
 * SPEC-20260603-1149 (Superadmin — CRUD de tenants).
 *
 * - `tb_tenant`: adiciona `tenant_status` (ciclo de vida do shopping) e
 *   `tenant_deleted_at` (soft-delete; dados preservados para auditoria).
 * - `tb_user`: torna `tenant_id` nullable para acomodar o papel `superadmin`
 *   global (não pertence a tenant) e adiciona índice único parcial garantindo
 *   email único entre superadmins (o `uq_tb_user_tenant_email` não cobre isso,
 *   pois NULL não colide em índice único no Postgres).
 */
export class AddTenantStatusAndSoftDelete1747104000000 implements MigrationInterface {
  name = 'AddTenantStatusAndSoftDelete1747104000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_tenant
        ADD COLUMN IF NOT EXISTS tenant_status varchar(20) NOT NULL DEFAULT 'trial',
        ADD COLUMN IF NOT EXISTS tenant_deleted_at timestamptz NULL
    `);

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_tenant
        ADD CONSTRAINT ck_tb_tenant_status
          CHECK (tenant_status IN ('active', 'trial', 'inactive', 'suspended'))
    `);

    // Tenants já existentes (criados via seed antes desta SPEC) eram operacionais → 'active'.
    await queryRunner.query(`
      UPDATE ${schemaName}.tb_tenant
        SET tenant_status = 'active'
        WHERE tenant_deleted_at IS NULL
    `);

    // Superadmin global não pertence a tenant.
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_user
        ALTER COLUMN tenant_id DROP NOT NULL
    `);

    // Email único entre superadmins (tenant_id NULL não é coberto por uq_tb_user_tenant_email).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_tb_user_superadmin_email
        ON ${schemaName}.tb_user (user_email)
        WHERE tenant_id IS NULL
    `);

    // Refresh token do superadmin também é tenant-less.
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_refresh_token
        ALTER COLUMN tenant_id DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_refresh_token
        ALTER COLUMN tenant_id SET NOT NULL
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS ${schemaName}.uq_tb_user_superadmin_email`,
    );

    // Reverter nullable exige que não haja usuários sem tenant (superadmins).
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_user
        ALTER COLUMN tenant_id SET NOT NULL
    `);

    await queryRunner.query(
      `ALTER TABLE ${schemaName}.tb_tenant DROP CONSTRAINT IF EXISTS ck_tb_tenant_status`,
    );

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_tenant
        DROP COLUMN IF EXISTS tenant_deleted_at,
        DROP COLUMN IF EXISTS tenant_status
    `);
  }
}
