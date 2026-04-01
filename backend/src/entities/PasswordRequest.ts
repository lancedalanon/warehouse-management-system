import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'password_requests' })
export class PasswordRequest {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'email', unique: true })
  email!: string;

  @Column({ name: 'token' })
  token!: string;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
