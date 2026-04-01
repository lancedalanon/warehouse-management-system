import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  GetProductsParams,
  Product,
  ProductCreatePayload,
  ProductUpdatePayload,
} from '@/features/products/types/product.types';

/**
 * GET /api/products
 * Paginated list
 */
export const getProductsApi = async (
  params?: GetProductsParams,
): Promise<{
  data: Product[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<Product[], PaginationMeta>>('/products', { params });

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * POST /api/products
 */
export const createProductApi = async (payload: ProductCreatePayload): Promise<Product> => {
  const res = await axios.post<ApiResponse<Product>>('/products', payload);

  return res.data.data;
};

/**
 * GET /api/products/{id}
 */
export const getProductApi = async (id: number | string): Promise<Product> => {
  const res = await axios.get<ApiResponse<Product>>(`/products/${id}`);

  return res.data.data;
};

/**
 * PUT /api/products/{id}
 */
export const updateProductApi = async (
  id: number | string,
  payload: ProductUpdatePayload,
): Promise<Product> => {
  const res = await axios.put<ApiResponse<Product>>(`/products/${id}`, payload);

  return res.data.data;
};

/**
 * DELETE /api/products/{id}
 */
export const deleteProductApi = async (id: number | string): Promise<void> => {
  await axios.delete<ApiResponse>(`/products/${id}`);
};

/**
 * POST /api/products/{id}/receive
 */
export const addReceivedApi = async (
  id: number | string,
  payload: { quantity: number; notes?: string },
): Promise<Product> => {
  const res = await axios.post<ApiResponse<Product>>(`/products/${id}/receive`, payload);
  return res.data.data;
};
