import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './OrderItem';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar', default: 'pending' })
  status!: string;

  @Column({ name: 'recipient_name', type: 'varchar' })
  recipientName!: string;

  @Column({ name: 'shipping_address', type: 'varchar' })
  shippingAddress!: string;

  @Column({ name: 'contact_number', type: 'varchar', nullable: true })
  contactNumber!: string | null;

  @Column({ name: 'priority_level', type: 'varchar', default: 'medium' })
  priorityLevel!: string;

  @Column({ name: 'expected_pickup_date', type: 'timestamp', nullable: true })
  expectedPickupDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items!: OrderItem[];
}
