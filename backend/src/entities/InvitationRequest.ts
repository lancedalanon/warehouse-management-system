import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Role } from './Role';
import { User } from './User';

@Entity({ name: 'invitation_requests' })
export class InvitationRequest {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName!: string;

  @Column({ name: 'middle_name', type: 'varchar', nullable: true })
  middleName!: string | null;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName!: string;

  @Column({ type: 'varchar', nullable: true })
  suffix!: string | null;

  @Column({ name: 'email', unique: true })
  email!: string;

  @Column({ name: 'token' })
  token!: string;

  @Column({ name: 'role_id', type: 'bigint' })
  roleId!: number;

  @ManyToOne(() => Role, (role) => role.invitationRequests)
  role!: Role;

  @Column({ name: 'declined_at', type: 'timestamp', nullable: true })
  declinedAt!: Date | null;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: true })
  joinedAt!: Date | null;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.invitationRequest, { nullable: true })
  user!: User | null;
}
