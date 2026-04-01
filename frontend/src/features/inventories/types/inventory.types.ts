import type { InventoryStatus } from '@/enums/InventoryStatus';
import type { Product } from '@/features/products/types/product.types';
import type { Location } from '@/features/locations/types/location.types';
import type { BaseListParams } from '@/types/api.types';
import { InventoryActionsMap, type InventoryAction } from '@/enums/InventoryActionsMap';

export type Inventory = Record<string, unknown> & {
  id: number;
  productId: number;
  locationId: number;
  storedQuantity: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  product?: Product;
  location?: Location;
};

export type InventoryCreatePayload = {
  productId: number;
  locationId: number;
};

export type InventoryUpdatePayload = {
  action: InventoryAction;
  locationId?: number | null;
  storedQuantity?: number;
  shippedQuantity?: number;
  transferredQuantity?: number;
  writeOffQuantity?: number;
  writeOffFrom?: Exclude<InventoryAction, typeof InventoryActionsMap.WRITE_OFF>;
  notes?: string | null;
};

export interface GetInventoriesParams extends BaseListParams {
  productId?: number;
  locationId?: number;
  status?: InventoryStatus;
  productIds?: number[];
  locationIds?: number[];
}
