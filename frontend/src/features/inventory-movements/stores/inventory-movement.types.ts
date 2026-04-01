import type { InventoryMovement } from '@/features/inventory-movements/types/inventory-movement.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type InventoryMovementsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface InventoryMovementsState {
  items: InventoryMovement[];
  meta: PaginationMeta | null;
  status: {
    fetch: InventoryMovementsStatus;
    single: InventoryMovementsStatus;
  };
  error: {
    fetch?: string;
    single?: string;
  };
  singleMovement?: InventoryMovement;
}
