import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { DashboardData } from '@/features/dashboard/types/dashboard.types';
import type { GetInventoriesParams } from '@/features/inventories/types/inventory.types';

/**
 * GET /api/dashboards
 * Returns inventory statuses and recent movements
 */
export const getDashboardApi = async (params?: GetInventoriesParams): Promise<DashboardData> => {
  const res = await axios.get<ApiResponse<DashboardData>>('/dashboards', { params });

  return res.data.data;
};

/**
 *
 * GET /api/dashboards/export
 * Exports dashboard data as PDF and returns the file URL
 */
export const exportDashboardApi = async (params?: GetInventoriesParams) => {
  const res = await axios.get<ApiResponse<{ url: string }>>('/dashboards/export', { params });
  return res.data.data;
};
