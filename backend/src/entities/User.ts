import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Role } from './Role';
import { RefreshToken } from './RefreshToken';
import { AuditLog } from './AuditLog';
import { InvitationRequest } from './InvitationRequest';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar', nullable: true })
  middleName!: string | null;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar', nullable: true })
  suffix!: string | null;

  @Column({ type: 'varchar', select: false })
  password!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs!: AuditLog[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToOne(() => InvitationRequest, (invitation) => invitation.user)
  invitationRequest!: InvitationRequest;
}
