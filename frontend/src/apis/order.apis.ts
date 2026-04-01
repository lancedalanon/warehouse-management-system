import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  Order,
  OrderCreatePayload,
  OrderUpdatePayload,
  GetOrdersParams,
} from '@/features/orders/types/order.types';

/**
 * GET /api/orders
 * Paginated list
 */
export const getOrdersApi = async (
  params?: GetOrdersParams,
): Promise<{
  data: Order[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<Order[], PaginationMeta>>('/orders', {
    params,
  });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * POST /api/orders
 */
export const createOrderApi = async (
  payload: OrderCreatePayload,
): Promise<Order> => {
  const res = await axios.post<ApiResponse<Order>>('/orders', payload);

  return res.data.data;
};

/**
 * GET /api/orders/{id}
 */
export const getOrderApi = async (
  id: number | string,
): Promise<Order> => {
  const res = await axios.get<ApiResponse<Order>>(`/orders/${id}`);

  return res.data.data;
};

/**
 * PUT /api/orders/{id}
 */
export const updateOrderApi = async (
  id: number | string,
  payload: OrderUpdatePayload,
): Promise<Order> => {
  const res = await axios.put<ApiResponse<Order>>(
    `/orders/${id}`,
    payload,
  );

  return res.data.data;
};