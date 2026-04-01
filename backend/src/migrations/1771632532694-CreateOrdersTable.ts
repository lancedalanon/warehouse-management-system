import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTable1771632532694 implements MigrationInterface {

public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" BIGSERIAL PRIMARY KEY,
        "code" VARCHAR NOT NULL UNIQUE,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "recipient_name" VARCHAR NOT NULL,
        "shipping_address" VARCHAR NOT NULL,
        "contact_number" VARCHAR NULL,
        "priority_level" VARCHAR NOT NULL DEFAULT 'medium',
        "expected_pickup_date" TIMESTAMP NULL,
        "notes" TEXT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE order_status_enum`);
  }

}
