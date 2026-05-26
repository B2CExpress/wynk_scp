import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTheaterShowTable1726518000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tb_theater_show',
        schema: 'scp',
        columns: [
          {
            name: 'show_id',
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
            name: 'show_title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'show_synopsis',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'show_duration_minutes',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'show_age_rating',
            type: 'varchar',
            length: '2',
            isNullable: false,
          },
          {
            name: 'show_ticket_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'show_status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'draft'",
          },
          {
            name: 'show_published_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'show_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'show_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'ix_tb_theater_show_tenant_status_published',
            columnNames: ['tenant_id', 'show_status', 'show_published_at'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_theater_show', true);
  }
}
