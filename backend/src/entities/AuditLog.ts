import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar' })
  event!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'auditable_type', type: 'varchar' })
  auditableType!: string;

  @Column({ name: 'auditable_id', type: 'bigint' })
  auditableId!: number;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
