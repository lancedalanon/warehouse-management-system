import type { Inventory } from '@/features/inventories/types/inventory.types';
import type { ValidationErrorItem } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type InventoriesStatus = 'idle' | 'loading' | 'success' | 'error';

export interface InventoriesState {
  items: Inventory[];
  meta: PaginationMeta | null;
  status: {
    fetch: InventoriesStatus;
    create: InventoriesStatus;
    update: InventoriesStatus;
    delete: InventoriesStatus;
  };
  error: {
    fetch?: string;
    create?: ValidationErrorItem[];
    update?: ValidationErrorItem[];
    delete?: string;
  };
  singleInventory?: Inventory;
}
