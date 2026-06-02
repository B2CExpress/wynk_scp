import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateHeroTable1747017600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tb_hero',
        schema: 'scp',
        columns: [
          {
            name: 'hero_id',
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
            isNullable: false,
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
            length: '7',
            isNullable: false,
            default: "'#000000'",
          },
          {
            name: 'hero_overlay_opacity',
            type: 'numeric',
            precision: 4,
            scale: 2,
            isNullable: false,
            default: 0.4,
          },
          {
            name: 'hero_created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'hero_updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'ux_tb_hero_tenant',
            columnNames: ['tenant_id'],
            isUnique: true,
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scp.tb_hero', true);
  }
}
