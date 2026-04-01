import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse, ValidationErrorItem } from '@/types/api.types';
import {
  getInventoriesApi,
  getInventoryApi,
  createInventoryApi,
  updateInventoryApi,
  deleteInventoryApi,
} from '@/apis/inventory.apis';
import type {
  Inventory,
  InventoryCreatePayload,
  InventoryUpdatePayload,
  GetInventoriesParams,
} from '@/features/inventories/types/inventory.types';
import type { PaginationMeta } from '@/types/pagination.types';

/* GET INVENTORIES (paginated) */
export const getInventoriesThunk = createAsyncThunk<
  { data: Inventory[]; meta: PaginationMeta },
  GetInventoriesParams | undefined,
  { rejectValue: string }
>('inventories/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getInventoriesApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch inventories');
  }
});

/* GET SINGLE INVENTORY */
export const getInventoryThunk = createAsyncThunk<
  Inventory,
  number | string,
  { rejectValue: string }
>('inventories/getOne', async (id, { rejectWithValue }) => {
  try {
    return await getInventoryApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch inventory');
  }
});

/* CREATE INVENTORY */
export const createInventoryThunk = createAsyncThunk<
  Inventory,
  InventoryCreatePayload,
  { rejectValue: ValidationErrorItem[] }
>('inventories/create', async (payload, { rejectWithValue }) => {
  try {
    return await createInventoryApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

/* UPDATE INVENTORY */
export const updateInventoryThunk = createAsyncThunk<
  Inventory,
  { id: number | string; payload: InventoryUpdatePayload },
  { rejectValue: ValidationErrorItem[] }
>('inventories/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateInventoryApi(id, payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

/* DELETE INVENTORY */
export const deleteInventoryThunk = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('inventories/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteInventoryApi(id);
    return id;
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to delete inventory');
  }
});
