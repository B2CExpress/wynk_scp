import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePopupTable1746931200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
            length: '10',
            isNullable: false,
            default: "'home'",
          },
          {
            name: 'popup_starts_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'popup_ends_at',
            type: 'timestamptz',
            isNullable: false,
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
        indices: [
          new TableIndex({
            name: 'ix_tb_popup_tenant_active_schedule',
            columnNames: [
              'tenant_id',
              'popup_is_active',
              'popup_starts_at',
              'popup_ends_at',
            ],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_popup', true);
  }
}
