import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Inventory } from './Inventory';
import { InventoryMovement } from './InventoryMovement';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: number;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar', nullable: true })
  capacity!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => Inventory, (inventory) => inventory.location)
  inventories!: Inventory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.fromLocation)
  movementsFrom!: InventoryMovement[];

  @OneToMany(() => InventoryMovement, (movement) => movement.toLocation)
  movementsTo!: InventoryMovement[];
}
