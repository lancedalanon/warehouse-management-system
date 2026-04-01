import { Inventory } from '@/entities/Inventory';
import { PaginationRequest } from '../../pagination/pagination.types';

export type InventoryPaginationRequest = PaginationRequest<Inventory> & {
  productIds?: string[];
  locationIds?: string[];
};
