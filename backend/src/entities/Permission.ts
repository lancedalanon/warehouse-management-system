import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Role } from './Role';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];
}
