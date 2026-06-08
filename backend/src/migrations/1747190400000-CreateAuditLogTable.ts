import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';

const schemaName = config.database.schema;

/**
 * SPEC-SQU-73 (Superadmin Impersonação com Auditoria).
 *
 * - `tb_audit_log`: tabela append-only de auditoria para eventos sensíveis.
 *   Registra impersonações, criações/remoções de tenants, mudanças de senha, etc.
 * - Índices para queries eficientes: por usuário, por tenant, por tipo de evento, por data.
 * - Constrains para garantir append-only (nenhum UPDATE/DELETE permitido via app).
 */
export class CreateAuditLogTable1747190400000 implements MigrationInterface {
  name = 'CreateAuditLogTable1747190400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.tb_audit_log (
        audit_id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        event_type varchar(50) NOT NULL,
        actor_user_id uuid NOT NULL,
        actor_role varchar(15) NOT NULL,
        target_tenant_id uuid,
        target_user_id uuid,
        metadata jsonb,
        ip_address varchar(45),
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    // Índices para queries eficientes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tb_audit_log_actor_created
        ON ${schemaName}.tb_audit_log (actor_user_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tb_audit_log_tenant_created
        ON ${schemaName}.tb_audit_log (target_tenant_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tb_audit_log_event_created
        ON ${schemaName}.tb_audit_log (event_type, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tb_audit_log_created
        ON ${schemaName}.tb_audit_log (created_at DESC)
    `);

    // Foreign key em actor_user_id (sem cascade para preservar histórico)
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        ADD CONSTRAINT fk_tb_audit_log_actor
          FOREIGN KEY (actor_user_id)
          REFERENCES ${schemaName}.tb_user (user_id)
          ON DELETE RESTRICT
    `);

    // Foreign keys opcionais em target_tenant_id e target_user_id (sem cascade)
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        ADD CONSTRAINT fk_tb_audit_log_tenant
          FOREIGN KEY (target_tenant_id)
          REFERENCES ${schemaName}.tb_tenant (tenant_id)
          ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        ADD CONSTRAINT fk_tb_audit_log_target_user
          FOREIGN KEY (target_user_id)
          REFERENCES ${schemaName}.tb_user (user_id)
          ON DELETE RESTRICT
    `);

    // Constraint para append-only: eventos válidos
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        ADD CONSTRAINT ck_tb_audit_log_event_type
          CHECK (event_type IN (
            'impersonate_start',
            'impersonate_stop',
            'tenant_created',
            'tenant_updated',
            'tenant_deleted',
            'user_created',
            'user_updated',
            'password_changed',
            'login',
            'logout'
          ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        DROP CONSTRAINT IF EXISTS ck_tb_audit_log_event_type
    `);

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        DROP CONSTRAINT IF EXISTS fk_tb_audit_log_target_user
    `);

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        DROP CONSTRAINT IF EXISTS fk_tb_audit_log_tenant
    `);

    await queryRunner.query(`
      ALTER TABLE ${schemaName}.tb_audit_log
        DROP CONSTRAINT IF EXISTS fk_tb_audit_log_actor
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS ${schemaName}.idx_tb_audit_log_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS ${schemaName}.idx_tb_audit_log_event_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS ${schemaName}.idx_tb_audit_log_tenant_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS ${schemaName}.idx_tb_audit_log_actor_created`);

    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaName}.tb_audit_log`);
  }
}
