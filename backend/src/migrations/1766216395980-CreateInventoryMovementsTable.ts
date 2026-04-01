import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInventoryMovementsTable1766216395980 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inventory_movements',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'inventory_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'product_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'from_location_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'to_location_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'from_state',
            type: 'varchar',
          },
          {
            name: 'to_state',
            type: 'varchar',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
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
      }),
      true,
    );

    // Foreign key for inventory_id
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['inventory_id'],
        referencedTableName: 'inventories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key for product_id
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Foreign keys for locations
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['from_location_id'],
        referencedTableName: 'locations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['to_location_id'],
        referencedTableName: 'locations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inventory_movements');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('inventory_movements', fk);
      }
    }
    await queryRunner.dropTable('inventory_movements');
  }
}
