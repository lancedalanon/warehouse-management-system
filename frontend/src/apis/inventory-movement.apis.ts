import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  InventoryMovement,
  GetInventoryMovementsParams,
} from '@/features/inventory-movements/types/inventory-movement.types';

/**
 * GET /api/inventory-movements
 * Paginated list
 */
export const getInventoryMovementsApi = async (
  params: GetInventoryMovementsParams,
): Promise<{
  data: InventoryMovement[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<InventoryMovement[], PaginationMeta>>(
    '/inventory-movements',
    { params },
  );

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * GET /api/inventory-movements/{id}
 */
export const getInventoryMovementApi = async (id: number | string): Promise<InventoryMovement> => {
  const res = await axios.get<ApiResponse<InventoryMovement>>(`/inventory-movements/${id}`);

  return res.data.data;
};
