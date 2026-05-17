import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStoreFieldsDescription1746748500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'tb_store',
      new TableColumn({
        name: 'store_description',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'tb_store',
      new TableColumn({
        name: 'store_external_url',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'tb_store',
      new TableColumn({
        name: 'store_opening_hours',
        type: 'jsonb',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('tb_store', 'store_opening_hours');
    await queryRunner.dropColumn('tb_store', 'store_external_url');
    await queryRunner.dropColumn('tb_store', 'store_description');
  }
}
