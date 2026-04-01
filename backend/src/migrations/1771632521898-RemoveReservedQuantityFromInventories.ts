import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveReservedQuantityFromInventories1771632521898 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('inventories', 'reserved_quantity');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventories"
      ADD COLUMN "reserved_quantity" integer NOT NULL DEFAULT 0
    `);
  }
}
