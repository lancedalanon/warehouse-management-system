import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  GetInventoriesParams,
  Inventory,
  InventoryCreatePayload,
  InventoryUpdatePayload,
} from '@/features/inventories/types/inventory.types';

/**
 * GET /api/inventories
 * Paginated list
 */
export const getInventoriesApi = async (
  params?: GetInventoriesParams,
): Promise<{
  data: Inventory[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<Inventory[], PaginationMeta>>('/inventories', { params });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * POST /api/inventories
 */
export const createInventoryApi = async (payload: InventoryCreatePayload): Promise<Inventory> => {
  const res = await axios.post<ApiResponse<Inventory>>('/inventories', payload);

  return res.data.data;
};

/**
 * GET /api/inventories/{id}
 */
export const getInventoryApi = async (id: number | string): Promise<Inventory> => {
  const res = await axios.get<ApiResponse<Inventory>>(`/inventories/${id}`);

  return res.data.data;
};

/**
 * PUT /api/inventories/{id}
 */
export const updateInventoryApi = async (
  id: number | string,
  payload: InventoryUpdatePayload,
): Promise<Inventory> => {
  const res = await axios.put<ApiResponse<Inventory>>(`/inventories/${id}`, payload);

  return res.data.data;
};

/**
 * DELETE /api/inventories/{id}
 */
export const deleteInventoryApi = async (id: number | string): Promise<void> => {
  await axios.delete<ApiResponse>(`/inventories/${id}`);
};
