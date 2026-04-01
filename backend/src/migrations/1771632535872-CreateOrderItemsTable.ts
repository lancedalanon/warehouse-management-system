import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderItemsTable1771632535872 implements MigrationInterface {

public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" BIGSERIAL PRIMARY KEY,
        "order_id" BIGINT NOT NULL,
        "inventory_source_id" BIGINT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP NULL,

        CONSTRAINT "UQ_order_inventory_source" UNIQUE ("order_id", "inventory_source_id"),

        CONSTRAINT "FK_order_items_order"
          FOREIGN KEY ("order_id")
          REFERENCES "orders"("id")
          ON DELETE CASCADE,
          
        CONSTRAINT "FK_order_items_inventory"
          FOREIGN KEY ("inventory_source_id")
          REFERENCES "inventories"("id")
          ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_items"`);
  }

}
