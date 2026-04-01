import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse, ValidationErrorItem } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

import {
  getOrdersApi,
  getOrderApi,
  createOrderApi,
  updateOrderApi,
} from '@/apis/order.apis';

import type {
  Order,
  OrderCreatePayload,
  OrderUpdatePayload,
  GetOrdersParams,
} from '@/features/orders/types/order.types';

/* GET ORDERS */
export const getOrdersThunk = createAsyncThunk<
  { data: Order[]; meta: PaginationMeta },
  GetOrdersParams | undefined,
  { rejectValue: string }
>('orders/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getOrdersApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(
      err.response?.data?.message ?? 'Failed to fetch orders',
    );
  }
});

/* GET ORDER */
export const getOrderThunk = createAsyncThunk<
  Order,
  number | string,
  { rejectValue: string }
>('orders/getOne', async (id, { rejectWithValue }) => {
  try {
    return await getOrderApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(
      err.response?.data?.message ?? 'Failed to fetch order',
    );
  }
});

/* CREATE */
export const createOrderThunk = createAsyncThunk<
  Order,
  OrderCreatePayload,
  { rejectValue: ValidationErrorItem[] }
>('orders/create', async (payload, { rejectWithValue }) => {
  try {
    return await createOrderApi(payload);
  } catch (error) {
    const err =
      error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

/* UPDATE */
export const updateOrderThunk = createAsyncThunk<
  Order,
  { id: number | string; payload: OrderUpdatePayload },
  { rejectValue: ValidationErrorItem[] }
>('orders/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateOrderApi(id, payload);
  } catch (error) {
    const err =
      error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});