import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Inventory } from './Inventory';
import { Location } from './Location';
import { Product } from './Product';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'inventory_id', type: 'bigint', nullable: true })
  inventoryId!: number | null;

  @ManyToOne(() => Inventory, (inventory) => inventory.movements)
  inventory!: Inventory | null;

  @Column({ name: 'product_id', type: 'bigint', nullable: true })
  productId!: number | null;

  @ManyToOne(() => Product, (product) => product.movements)
  product!: Product | null;

  @Column({ name: 'from_location_id', type: 'bigint', nullable: true })
  fromLocationId!: number | null;

  @ManyToOne(() => Location, (location) => location.movementsFrom)
  fromLocation!: Location | null;

  @Column({ name: 'to_location_id', type: 'bigint', nullable: true })
  toLocationId!: number | null;

  @ManyToOne(() => Location, (location) => location.movementsTo)
  toLocation!: Location | null;

  @Column({ name: 'from_state', type: 'varchar' })
  fromState!: string;

  @Column({ name: 'to_state', type: 'varchar' })
  toState!: string;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
