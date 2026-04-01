import { InventoryStatus } from '@/enums/InventoryStatus';

export const STATUS_COLORS: Record<
  InventoryStatus | 'default',
  { bg: string; text: string; dot: string }
> = {
  [InventoryStatus.RECEIVED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },

  [InventoryStatus.STORED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },

  [InventoryStatus.RESERVED]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
  },

  [InventoryStatus.WRITTEN_OFF]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-500',
  },

  [InventoryStatus.SHIPPED]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
  },

  [InventoryStatus.TRANSFERRED]: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },

  // fallback for unknown / corrupted state
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-500',
  },
};

export type StatusType = keyof typeof STATUS_COLORS;

export const PENDING_DECLINED_COLORS = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  declined: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  default: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
} as const;

export type PendingDeclinedStatus = keyof typeof PENDING_DECLINED_COLORS;
