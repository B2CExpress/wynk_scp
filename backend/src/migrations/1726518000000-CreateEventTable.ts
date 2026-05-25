import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateEventTable1726518000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tb_event',
        schema: 'scp',
        columns: [
          {
            name: 'event_id',
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
            name: 'event_title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'event_slug',
            type: 'varchar',
            length: '250',
            isNullable: false,
          },
          {
            name: 'event_summary',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'event_body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'event_starts_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'event_ends_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'event_location',
            type: 'varchar',
            length: '300',
            isNullable: true,
          },
          {
            name: 'event_ticket_info',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'event_status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'draft'",
          },
          {
            name: 'event_published_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'event_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'event_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'uq_tb_event_tenant_slug',
            columnNames: ['tenant_id', 'event_slug'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'ix_tb_event_tenant_starts',
            columnNames: ['tenant_id', 'event_starts_at'],
          }),
          new TableIndex({
            name: 'ix_tb_event_tenant_status_published',
            columnNames: ['tenant_id', 'event_status', 'event_published_at'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_event', true);
  }
}
