import type { BaseListParams } from '@/types/api.types';
import type { Inventory } from '@/features/inventories/types/inventory.types';

export type OrderStatus =
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'confirmed';

export type OrderPriority = 'low' | 'medium' | 'high';

export type OrderItem = {
  id?: number;
  orderId?: number;
  inventorySourceId: number;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  inventorySource?: Inventory;
};

export type Order = Record<string, unknown> & {
  id: number | string;
  code: string;
  status: OrderStatus;
  priorityLevel: OrderPriority;
  recipientName: string;
  shippingAddress: string;
  contactNumber?: string | null;
  expectedPickupDate?: Date | string | null | undefined;
  notes?: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type OrderCreatePayload = {
  items: {
    inventorySourceId: number;
    quantity: number;
  }[];
};

export type OrderUpdatePayload = {
  code?: string;
  status?: OrderStatus;
  recipientName?: string;
  shippingAddress?: string;
  contactNumber?: string;
  priorityLevel?: OrderPriority;
  expectedPickupDate?: Date | string | null | undefined;
  notes?: string | null;
  items?: {
    inventorySourceId: number;
    quantity: number;
  }[];
};

export interface GetOrdersParams extends BaseListParams {
  status?: OrderStatus;
}