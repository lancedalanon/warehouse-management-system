export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderStatuses: OrderStatus[] = Object.values(OrderStatus);
