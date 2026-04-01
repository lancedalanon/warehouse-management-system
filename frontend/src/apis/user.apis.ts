import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  GetUsersParams,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from '@/features/users/types/user.types';

/**
 * GET /api/users
 * Paginated list
 */
export const getUsersApi = async (
  params?: GetUsersParams,
): Promise<{
  data: User[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<User[], PaginationMeta>>('/users', {
    params,
  });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * POST /api/users
 */
export const createUserApi = async (payload: UserCreatePayload): Promise<User> => {
  const res = await axios.post<ApiResponse<User>>('/users', payload);

  return res.data.data;
};

/**
 * GET /api/users/{id}
 */
export const getUserApi = async (id: number | string): Promise<User> => {
  const res = await axios.get<ApiResponse<User>>(`/users/${id}`);

  return res.data.data;
};

/**
 * PUT /api/users/{id}
 */
export const updateUserApi = async (
  id: number | string,
  payload: UserUpdatePayload,
): Promise<User> => {
  const res = await axios.put<ApiResponse<User>>(`/users/${id}`, payload);

  return res.data.data;
};

/**
 * DELETE /api/users/{id}
 */
export const deleteUserApi = async (id: number | string): Promise<void> => {
  await axios.delete<ApiResponse>(`/users/${id}`);
};
