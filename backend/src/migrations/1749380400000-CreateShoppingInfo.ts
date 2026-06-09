import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShoppingInfo1749380400000 implements MigrationInterface {
  name = 'CreateShoppingInfo1749380400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "scp"."shopping_info" (
        "id"               uuid          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"        uuid          NOT NULL,
        "address"          text          NOT NULL,
        "address_lat"      decimal(10,7),
        "address_lng"      decimal(10,7),
        "phone"            varchar(20)   NOT NULL,
        "phone_secondary"  varchar(20),
        "email"            varchar(200)  NOT NULL,
        "opening_hours"    jsonb         NOT NULL DEFAULT '{}',
        "parking_rates"    jsonb         NOT NULL DEFAULT '[]',
        "facebook_url"     text,
        "instagram_url"    text,
        "youtube_url"      text,
        "linkedin_url"     text,
        "tiktok_url"       text,
        "created_at"       TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shopping_info" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shopping_info_tenant_id" UNIQUE ("tenant_id"),
        CONSTRAINT "FK_shopping_info_tenant"
          FOREIGN KEY ("tenant_id")
          REFERENCES "scp"."tb_tenant"("tenant_id")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "scp"."shopping_info"`);
  }
}