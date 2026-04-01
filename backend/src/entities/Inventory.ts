import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
  Unique,
} from 'typeorm';
import { Product } from './Product';
import { Location } from './Location';
import { InventoryMovement } from './InventoryMovement';
import { OrderItem } from './OrderItem';

@Unique('inventory_product_location_unique', ['productId', 'locationId'])
@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: number;

  @ManyToOne(() => Product, (product) => product.inventories)
  product!: Product;

  @Column({ name: 'location_id', type: 'bigint', nullable: true })
  locationId!: number | null;

  @ManyToOne(() => Location, (location) => location.inventories)
  location!: Location;

  @Column({ name: 'stored_quantity', type: 'int', default: 0 })
  storedQuantity!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => InventoryMovement, (movement) => movement.inventory)
  movements!: InventoryMovement[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.inventorySource)
  orderItems!: OrderItem[];
}
