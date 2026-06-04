import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Cria as 4 tabelas de configuração da home:
 *   - tb_banner         (já existia — mantida)
 *   - tb_tenant_hero    (1:1 com tenant — tenant_id é PK + FK)
 *   - tb_popup          (N por tenant, mas UNIQUE parcial: só 1 is_active=true por vez)
 *   - tb_tenant_settings (1:1 com tenant — tenant_id é PK + FK)
 */
export class CreateHomeConfigTables1746844900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ //
    // 1. tb_tenant_hero  (relação 1:1 — tenant_id é a PK)                //
    // ------------------------------------------------------------------ //
    await queryRunner.createTable(
      new Table({
        name: 'tb_tenant_hero',
        schema: 'scp',
        columns: [
          {
            name: 'tenant_id',
            type: 'uuid',
            isPrimary: true,   // PK = FK garante 1:1
          },
          {
            name: 'hero_title',
            type: 'varchar',
            length: '300',
            isNullable: false,
          },
          {
            name: 'hero_subtitle',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'hero_background_image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hero_cta_text',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'hero_cta_link',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hero_overlay_color',
            type: 'varchar',
            length: '7',   // ex: #1a2b3c
            isNullable: true,
          },
          {
            name: 'hero_overlay_opacity',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
            default: 0.4,
          },
          {
            name: 'hero_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        checks: [
          {
            name: 'ck_tb_tenant_hero_overlay_opacity',
            expression: 'hero_overlay_opacity >= 0 AND hero_overlay_opacity <= 1',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'scp.tb_tenant_hero',
      new TableForeignKey({
        name: 'fk_tb_tenant_hero_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'scp.tb_tenant',
        referencedColumnNames: ['tenant_id'],
        onDelete: 'CASCADE',
      }),
    );

    // ------------------------------------------------------------------ //
    // 2. tb_popup  (N por tenant; UNIQUE parcial: 1 ativo por vez)        //
    // ------------------------------------------------------------------ //
    await queryRunner.createTable(
      new Table({
        name: 'tb_popup',
        schema: 'scp',
        columns: [
          {
            name: 'popup_id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'popup_title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'popup_image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'popup_html_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'popup_link_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'popup_show_after_seconds',
            type: 'integer',
            isNullable: false,
            default: 3,
          },
          {
            name: 'popup_show_only_once',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'popup_show_on_pages',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'home'",
          },
          {
            name: 'popup_starts_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'popup_ends_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'popup_is_active',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'popup_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'popup_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        checks: [
          {
            name: 'ck_tb_popup_show_after_seconds',
            expression: 'popup_show_after_seconds >= 0',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'scp.tb_popup',
      new TableForeignKey({
        name: 'fk_tb_popup_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'scp.tb_tenant',
        referencedColumnNames: ['tenant_id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índice normal para listagem
    await queryRunner.createIndex(
      'scp.tb_popup',
      new TableIndex({
        name: 'ix_tb_popup_tenant_active',
        columnNames: ['tenant_id', 'popup_is_active'],
      }),
    );

    // UNIQUE parcial — TypeORM não suporta WHERE nativo, então SQL direto
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_tb_popup_one_active_per_tenant
        ON scp.tb_popup (tenant_id)
       WHERE popup_is_active = true
    `);

    // ------------------------------------------------------------------ //
    // 3. tb_tenant_settings  (1:1 — tenant_id é PK + FK)                 //
    // ------------------------------------------------------------------ //
    await queryRunner.createTable(
      new Table({
        name: 'tb_tenant_settings',
        schema: 'scp',
        columns: [
          {
            name: 'tenant_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'settings_footer_about',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_footer_address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_footer_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'settings_footer_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'settings_social_facebook',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_social_instagram',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_social_youtube',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_social_tiktok',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_google_analytics_id',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'settings_google_tag_manager_id',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'settings_facebook_pixel_id',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            // ⚠️  Somente superadmin pode escrever aqui (vetor XSS se exposto a tenant_admin)
            name: 'settings_extra_head_html',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'settings_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'scp.tb_tenant_settings',
      new TableForeignKey({
        name: 'fk_tb_tenant_settings_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'scp.tb_tenant',
        referencedColumnNames: ['tenant_id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Ordem inversa para respeitar FKs
    await queryRunner.dropTable('scp.tb_tenant_settings', true);
    await queryRunner.query(`DROP INDEX IF EXISTS scp.uq_tb_popup_one_active_per_tenant`);
    await queryRunner.dropTable('scp.tb_popup', true);
    await queryRunner.dropTable('scp.tb_tenant_hero', true);
  }
}
