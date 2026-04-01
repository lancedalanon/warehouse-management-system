import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  GetLocationsParams,
  Location,
  LocationCreatePayload,
  LocationUpdatePayload,
} from '@/features/locations/types/location.types';

/**
 * GET /api/locations
 * Paginated list
 */
export const getLocationsApi = async (
  params?: GetLocationsParams,
): Promise<{
  data: Location[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<Location[], PaginationMeta>>('/locations', { params });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * POST /api/locations
 */
export const createLocationApi = async (payload: LocationCreatePayload): Promise<Location> => {
  const res = await axios.post<ApiResponse<Location>>('/locations', payload);

  return res.data.data;
};

/**
 * GET /api/locations/{id}
 */
export const getLocationApi = async (id: number | string): Promise<Location> => {
  const res = await axios.get<ApiResponse<Location>>(`/locations/${id}`);

  return res.data.data;
};

/**
 * PUT /api/locations/{id}
 */
export const updateLocationApi = async (
  id: number | string,
  payload: LocationUpdatePayload,
): Promise<Location> => {
  const res = await axios.put<ApiResponse<Location>>(`/locations/${id}`, payload);

  return res.data.data;
};

/**
 * DELETE /api/locations/{id}
 */
export const deleteLocationApi = async (id: number | string): Promise<void> => {
  await axios.delete<ApiResponse>(`/locations/${id}`);
};
