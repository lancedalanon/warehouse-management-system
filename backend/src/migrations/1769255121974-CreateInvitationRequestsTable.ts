import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInvitationRequestsTable1769255121974 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'invitation_requests',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'first_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'middle_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'suffix',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'token',
            type: 'varchar',
          },
          {
            name: 'role_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'declined_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'joined_at',
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
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'invitation_requests',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invitation_requests',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('invitation_requests');

    // Drop foreign keys
    const roleFK = table!.foreignKeys.find((fk) =>
      fk.columnNames.includes('role_id'),
    );
    if (roleFK) await queryRunner.dropForeignKey('invitation_requests', roleFK);

    const userFK = table!.foreignKeys.find((fk) =>
      fk.columnNames.includes('user_id'),
    );
    if (userFK) await queryRunner.dropForeignKey('invitation_requests', userFK);

    await queryRunner.dropTable('invitation_requests');
  }
}
