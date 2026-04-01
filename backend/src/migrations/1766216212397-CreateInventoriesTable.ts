import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInventoriesTable1766216212397 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inventories',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'product_id',
            type: 'bigint',
          },
          {
            name: 'location_id',
            type: 'bigint',
          },
          {
            name: 'stored_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'reserved_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'unique_inventory_slot',
            columnNames: ['product_id', 'location_id'],
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'inventories',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'inventories',
      new TableForeignKey({
        columnNames: ['location_id'],
        referencedTableName: 'locations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventories');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('inventories', fk);
      }
    }

    await queryRunner.dropTable('inventories');
  }
}
