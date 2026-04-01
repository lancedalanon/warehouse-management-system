export const InventoryActionsMap = {
  STORE: 'store',
  SHIP: 'ship',
  WRITE_OFF: 'write-off',
  TRANSFER: 'transfer',
} as const;

export type InventoryAction = (typeof InventoryActionsMap)[keyof typeof InventoryActionsMap];

export const InventoryActions: InventoryAction[] = Object.values(InventoryActionsMap);
