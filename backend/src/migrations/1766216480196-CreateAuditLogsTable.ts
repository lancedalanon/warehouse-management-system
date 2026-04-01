import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuditLogsTable1766216480196 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'event',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'auditable_type',
            type: 'varchar',
          },
          {
            name: 'auditable_id',
            type: 'bigint',
          },
          {
            name: 'user_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
