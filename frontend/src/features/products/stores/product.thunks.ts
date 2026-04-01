import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse, ValidationErrorItem } from '@/types/api.types';
import {
  getProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getProductApi,
  addReceivedApi,
} from '@/apis/product.apis';
import type {
  AddReceivedPayload,
  Product,
  ProductCreatePayload,
  ProductUpdatePayload,
} from '@/features/products/types/product.types';
import type { GetProductsParams } from '@/features/products/types/product.types';
import type { PaginationMeta } from '@/types/pagination.types';

export const getProductsThunk = createAsyncThunk<
  { data: Product[]; meta: PaginationMeta },
  GetProductsParams | undefined,
  { rejectValue: string }
>('products/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getProductsApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch products');
  }
});

export const getProductThunk = createAsyncThunk<Product, number | string, { rejectValue: string }>(
  'products/getOne',
  async (id, { rejectWithValue }) => {
    try {
      return await getProductApi(id);
    } catch (error) {
      const err = error as AxiosError<ApiResponse>;
      return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch product');
    }
  },
);

export const createProductThunk = createAsyncThunk<
  Product,
  ProductCreatePayload,
  { rejectValue: ValidationErrorItem[] }
>('products/create', async (payload, { rejectWithValue }) => {
  try {
    return await createProductApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const updateProductThunk = createAsyncThunk<
  Product,
  { id: number | string; payload: ProductUpdatePayload },
  { rejectValue: ValidationErrorItem[] }
>('products/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateProductApi(id, payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const deleteProductThunk = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('products/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteProductApi(id);
    return id;
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to delete product');
  }
});

export const addReceivedThunk = createAsyncThunk<
  Product,
  { id: number | string; payload: AddReceivedPayload },
  { rejectValue: ValidationErrorItem[] }
>('products/addReceived', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const updatedProduct = await addReceivedApi(id, payload);
    return updatedProduct;
  } catch (error) {
    const err = error as AxiosError<{ status?: string; error?: ValidationErrorItem[] }>;
    if (
      err.response?.data.status === 'VALIDATION_ERROR' &&
      Array.isArray(err.response.data.error)
    ) {
      return rejectWithValue(err.response.data.error);
    }
    throw error;
  }
});
