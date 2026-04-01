import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type { Role, GetRolesParams } from '@/features/roles/types/role.types';

/**
 * GET /api/roles
 * Paginated list of roles
 */
export const getRolesApi = async (
  params?: GetRolesParams,
): Promise<{
  data: Role[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<Role[], PaginationMeta>>('/roles', { params });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * GET /api/roles/{id}
 * Get a single role by ID
 */
export const getRoleApi = async (id: number | string): Promise<Role> => {
  const res = await axios.get<ApiResponse<Role>>(`/roles/${id}`);

  return res.data.data;
};
