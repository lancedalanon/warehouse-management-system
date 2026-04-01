export const InventoryStatus = {
  RECEIVED: 'received',
  STORED: 'stored',
  RESERVED: 'reserved',
  WRITTEN_OFF: 'written-off',
  SHIPPED: 'shipped',
  TRANSFERRED: 'transferred',
} as const;

export type InventoryStatus = (typeof InventoryStatus)[keyof typeof InventoryStatus];

export const InventoryStatuses: InventoryStatus[] = Object.values(InventoryStatus);
