import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBannerTable1746844800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tb_banner',
        schema: 'scp',
        columns: [
          {
            name: 'banner_id',
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
            name: 'banner_title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'banner_image_desktop_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'banner_image_mobile_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'banner_alt_text',
            type: 'varchar',
            length: '300',
            isNullable: false,
          },
          {
            name: 'banner_link_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'banner_link_target',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'_self'",
          },
          {
            name: 'banner_starts_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'banner_ends_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'banner_is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'banner_sort_order',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'banner_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'banner_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'ix_tb_banner_tenant_sort',
            columnNames: ['tenant_id', 'banner_sort_order'],
          }),
          new TableIndex({
            name: 'ix_tb_banner_tenant_active_schedule',
            columnNames: ['tenant_id', 'banner_is_active', 'banner_starts_at', 'banner_ends_at'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_banner', true);
  }
}
