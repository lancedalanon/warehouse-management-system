import type { DashboardData } from '../types/dashboard.types';

export type DashboardStatus = 'idle' | 'loading' | 'success' | 'error';
export type DashboardExportStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DashboardState {
  data: DashboardData | null;
  status: DashboardStatus;
  error?: string;
  exportUrl: string | undefined;
  exportStatus: DashboardExportStatus;
}
