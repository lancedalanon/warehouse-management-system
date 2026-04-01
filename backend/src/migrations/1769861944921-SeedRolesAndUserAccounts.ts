import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcrypt';
import { Role } from '../enums/Role';

export class SeedRolesAndUserAccounts1769861944921 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles = [
      { name: 'Super Admin', code: Role.SUPERADMIN, userName: 'Super Admin' },
      { name: 'Warehouse Manager', code: Role.WAREHOUSE_MANAGER, userName: 'Warehouse Manager' },
      { name: 'Inventory Staff', code: Role.INVENTORY_STAFF, userName: 'Inventory Staff' },
      { name: 'Auditor', code: Role.AUDITOR, userName: 'Auditor Account' },
    ];

    const hashedPassword = await bcrypt.hash('password', 10);

    for (const r of roles) {
      // --- Check if role exists ---
      const roleRes = await queryRunner.query(
        `SELECT id FROM roles WHERE code = '${r.code}'`
      );

      let roleId: number;
      if (roleRes.length > 0) {
        roleId = roleRes[0].id;
      } else {
        // Insert role
        const insertRoleRes = await queryRunner.query(`
          INSERT INTO roles (name, code)
          VALUES ('${r.name}', '${r.code}')
          RETURNING id
        `);
        roleId = insertRoleRes[0].id;
      }

      // --- Prepare user data ---
      const nameParts = r.userName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      const email = `${r.code}@example.com`;

      // --- Check if user exists ---
      const userRes = await queryRunner.query(
        `SELECT id FROM users WHERE email = '${email}'`
      );

      let userId: number;
      if (userRes.length > 0) {
        userId = userRes[0].id;
      } else {
        // Insert user
        const insertUserRes = await queryRunner.query(`
          INSERT INTO users (first_name, last_name, email, password, email_verified_at)
          VALUES ('${firstName}', '${lastName}', '${email}', '${hashedPassword}', NOW())
          RETURNING id
        `);
        userId = insertUserRes[0].id;
      }

      // --- Assign role to user if not already assigned ---
      const userRoleRes = await queryRunner.query(`
        SELECT * FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId}
      `);

      if (userRoleRes.length === 0) {
        await queryRunner.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (${userId}, ${roleId})
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete user-role assignments for seeded users
    await queryRunner.query(`
      DELETE FROM user_roles 
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com')
    `);

    // Delete seeded users
    await queryRunner.query(`
      DELETE FROM users WHERE email LIKE '%@example.com'
    `);

    // Delete seeded roles except Super Admin
    await queryRunner.query(`
      DELETE FROM roles 
      WHERE code IN ('warehouse-manager', 'inventory-staff', 'auditor')
    `);
  }
}
