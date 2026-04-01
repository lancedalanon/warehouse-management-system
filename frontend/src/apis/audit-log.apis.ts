import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type { AuditLog, GetAuditLogsParams } from '@/features/audit-logs/types/audit-log.types';

/**
 * GET /api/audit-logs
 * Paginated list
 */
export const getAuditLogsApi = async (
  params: GetAuditLogsParams,
): Promise<{
  data: AuditLog[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<AuditLog[], PaginationMeta>>('/audit-logs', { params });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * GET /api/audit-logs/{id}
 */
export const getAuditLogApi = async (id: number | string): Promise<AuditLog> => {
  const res = await axios.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);

  return res.data.data;
};
