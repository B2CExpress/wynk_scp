import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateNewsTable1746748600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tb_news',
        schema: 'scp',
        columns: [
          {
            name: 'news_id',
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
            name: 'news_title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'news_slug',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'news_summary',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'news_body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'news_cover_image_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'news_author',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'news_category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'news_status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'draft'",
          },
          {
            name: 'news_published_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'news_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'news_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'uq_tb_news_tenant_slug',
            columnNames: ['tenant_id', 'news_slug'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'ix_tb_news_tenant_status',
            columnNames: ['tenant_id', 'news_status'],
          }),
          new TableIndex({
            name: 'ix_tb_news_tenant_published',
            columnNames: ['tenant_id', 'news_published_at'],
          }),
          new TableIndex({
            name: 'ix_tb_news_status_published',
            columnNames: ['news_status', 'news_published_at'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_news', true);
  }
}
