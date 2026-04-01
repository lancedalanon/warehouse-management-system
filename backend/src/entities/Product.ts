import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Inventory } from './Inventory';
import { InventoryMovement } from './InventoryMovement';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', unique: true })
  sku!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ name: 'unit_type', type: 'varchar' })
  unitType!: string;

  @Column({ name: 'received_quantity', type: 'int', default: 0 })
  receivedQuantity!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories!: Inventory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.product)
  movements!: InventoryMovement[];
}
