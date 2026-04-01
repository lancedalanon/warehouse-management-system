import type { Order } from '@/features/orders/types/order.types';
import type { ValidationErrorItem } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type OrdersStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OrdersState {
  items: Order[];
  meta: PaginationMeta | null;
  status: {
    fetch: OrdersStatus;
    create: OrdersStatus;
    update: OrdersStatus;
  };
  error: {
    fetch?: string;
    create?: ValidationErrorItem[];
    update?: ValidationErrorItem[];
  };
  singleOrder?: Order;
}
