import { InventoryAgingWithPercentages } from './inventory-aging.types';
import { NetStock } from './net-stock.types';
import { StockVelocity } from './stock-velocity.types';
import { TopMover } from './top-mover.types';
import { WarehouseRisk } from './warehouse-risk.types';

export interface RecentMovement {
  date: string | number;
  received: string | number;
  stored: string | number;
  reserved: string | number;
  shipped: string | number;
  transferred: string | number;
  writtenOff: string | number;
}

export interface DashboardData {
  inventoryStatuses: { type: string; count: number }[];
  recentMovements: RecentMovement[];
}

export type DateRange = 'today' | 'weekly' | 'monthly' | 'yearly';

export interface RawMovementRow {
  dateKey: string;
  sortDate: Date;
  received: string | number;
  stored: string | number;
  reserved: string | number;
  shipped: string | number;
  transferred: string | number;
  writtenOff: string | number;
}

export interface WarehousePdfTemplate {
  meta: {
    dateRange: string;
    generatedAt: string;
    generatedBy: string;
  };
  data: {
    statusSummary: { type: string; count: number }[];
    trends: RecentMovement[];
    netStock: NetStock;
    topMovers: TopMover[];
    aging: InventoryAgingWithPercentages;
    velocity: StockVelocity;
    risk: WarehouseRisk;
  };
}
