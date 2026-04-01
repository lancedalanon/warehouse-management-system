export enum InventoryStatus {
  EXTERNAL = 'external',
  RECEIVED = 'received',
  STORED = 'stored',
  WRITTEN_OFF = 'written-off',
  SHIPPED = 'shipped',
  TRANSFERRED = 'transferred',
}

export const InventoryStatuses = [
  'external',
  'received',
  'stored',
  'written-off',
  'shipped',
  'transferred',
] as const;
