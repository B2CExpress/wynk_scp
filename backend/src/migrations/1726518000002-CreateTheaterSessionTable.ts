import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTheaterSessionTable1726518000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tb_theater_session',
        schema: 'scp',
        columns: [
          {
            name: 'session_id',
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
            name: 'show_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'session_starts_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'session_ticket_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'session_is_sold_out',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'session_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'session_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'ix_tb_theater_session_show_starts',
            columnNames: ['show_id', 'session_starts_at'],
          }),
          new TableIndex({
            name: 'ix_tb_theater_session_tenant_starts',
            columnNames: ['tenant_id', 'session_starts_at'],
          }),
        ],
        foreignKeys: [
          {
            columnNames: ['show_id'],
            referencedTableName: 'tb_theater_show',
            referencedSchema: 'scp',
            referencedColumnNames: ['show_id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_theater_session', true);
  }
}
