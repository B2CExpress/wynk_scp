import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

// SPEC-20260516-1430: adiciona external_url e opening_hours na tb_store.
// store_description NÃO entra aqui — já é criado pela migration
// 1746748400000-CreateStoreTables (PR #9 fulltext absorveu a coluna lá).
export class AddStoreExternalUrlAndOpeningHours1746748500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
