import type { InventoryStatus } from '@/enums/InventoryStatus';
import type { BaseListParams } from '@/types/api.types';

export type InventoryStatusCount = {
  type: InventoryStatus;
  count: number;
};

export type RecentMovement = {
  date: string;
} & Record<InventoryStatus, number>;

export interface DashboardData {
  inventoryStatuses: InventoryStatusCount[];
  recentMovements: RecentMovement[];
}

export interface GetDashboardParams extends BaseListParams {
  startDate?: string;
  endDate?: string;
  dateRange?: string;
}
