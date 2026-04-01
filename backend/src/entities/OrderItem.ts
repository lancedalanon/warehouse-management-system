import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Order } from './Order';
import { Inventory } from './Inventory';

@Entity('order_items')
@Unique(['orderId', 'inventorySourceId'])
export class OrderItem {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId!: number;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'inventory_source_id', type: 'bigint' })
  inventorySourceId!: number;

  @ManyToOne(() => Inventory, (inventory) => inventory.orderItems, {
    onDelete: 'RESTRICT',
  })
  
  @JoinColumn({ name: 'inventory_source_id' })
  inventorySource!: Inventory;

  @Column({ type: 'int' })
  quantity!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}