import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

import { getInventoryMovementsApi, getInventoryMovementApi } from '@/apis/inventory-movement.apis';

import type {
  InventoryMovement,
  GetInventoryMovementsParams,
} from '@/features/inventory-movements/types/inventory-movement.types';

/* GET INVENTORY MOVEMENTS (paginated) */
export const getInventoryMovementsThunk = createAsyncThunk<
  { data: InventoryMovement[]; meta: PaginationMeta },
  GetInventoryMovementsParams,
  { rejectValue: string }
>('inventoryMovements/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getInventoryMovementsApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch inventory movements');
  }
});

/* GET SINGLE INVENTORY MOVEMENT */
export const getInventoryMovementThunk = createAsyncThunk<
  InventoryMovement,
  number | string,
  { rejectValue: string }
>('inventoryMovements/getOne', async (id, { rejectWithValue }) => {
  try {
    return await getInventoryMovementApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch inventory movement');
  }
});
