export const INVENTORY_STATUS_CONFIG = {
  Received: {
    label: 'Received',
    dotColor: 'bg-blue-500',
    accentColor: 'bg-blue-500',
  },
  Available: {
    label: 'Available',
    dotColor: 'bg-green-500',
    accentColor: 'bg-green-500',
  },
  Reserved: {
    label: 'Reserved',
    dotColor: 'bg-yellow-500',
    accentColor: 'bg-yellow-500',
  },
  Damaged: {
    label: 'Damaged',
    dotColor: 'bg-red-500',
    accentColor: 'bg-red-500',
  },
  Lost: {
    label: 'Lost',
    dotColor: 'bg-gray-500',
    accentColor: 'bg-gray-500',
  },
  Shipped: {
    label: 'Shipped',
    dotColor: 'bg-purple-500',
    accentColor: 'bg-purple-500',
  },
} as const;

export type InventoryStatusType = keyof typeof INVENTORY_STATUS_CONFIG;
