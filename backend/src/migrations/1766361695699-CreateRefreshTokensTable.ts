import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRefreshTokensTable1766361695699 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'token_hash',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expired_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'rotated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'replaced_by_token_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
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
        indices: [
          { columnNames: ['user_id'] },
          { columnNames: ['expired_at'] },
          { columnNames: ['is_revoked'] },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens');

    const foreignKey = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('user_id'),
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('refresh_tokens', foreignKey);
    }

    await queryRunner.dropTable('refresh_tokens');
  }
}
