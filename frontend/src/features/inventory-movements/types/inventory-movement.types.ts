import type { InventoryStatus } from '@/enums/InventoryStatus';
import type { Inventory } from '@/features/inventories/types/inventory.types';
import type { Location } from '@/features/locations/types/location.types';
import type { Product } from '@/features/products/types/product.types';
import type { BaseListParams } from '@/types/api.types';

export type InventoryMovement = Record<string, unknown> & {
  id: number;
  inventoryId: number | null;
  productId: number | null;
  fromLocationId: number | null;
  toLocationId: number | null;
  fromState: string;
  toState: string;
  type: string;
  quantity: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  inventory?: Inventory | null;
  product?: Product | null;
  fromLocation?: Location;
  toLocation?: Location;
};

export interface GetInventoryMovementsParams extends BaseListParams {
  fromLocationId?: number;
  toLocationId?: number;
  type?: InventoryStatus;
  inventoryId?: number | null;
  fromState?: string;
  toState?: string;
}
