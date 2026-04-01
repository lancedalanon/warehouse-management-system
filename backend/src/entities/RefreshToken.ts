import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { User } from './User';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'bigint' })
  @Index()
  userId!: number;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ name: 'token_hash', type: 'varchar', unique: true })
  tokenHash!: string;

  @Column({ name: 'expired_at', type: 'timestamp' })
  @Index()
  expiredAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  @Index()
  isRevoked!: boolean;

  @Column({ name: 'rotated_at', type: 'timestamp', nullable: true })
  rotatedAt!: Date | null;

  @Column({ name: 'replaced_by_token_id', type: 'bigint', nullable: true })
  replacedByTokenId!: number | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
