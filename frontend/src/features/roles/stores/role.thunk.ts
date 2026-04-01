import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api.types';
import { getRolesApi, getRoleApi } from '@/apis/role.apis';
import type { Role } from '@/features/roles/types/role.types';
import type { BaseListParams } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

export const getRolesThunk = createAsyncThunk<
  { data: Role[]; meta: PaginationMeta },
  BaseListParams | undefined,
  { rejectValue: string }
>('roles/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getRolesApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch roles');
  }
});

export const getRoleThunk = createAsyncThunk<Role, number | string, { rejectValue: string }>(
  'roles/getOne',
  async (id, { rejectWithValue }) => {
    try {
      return await getRoleApi(id);
    } catch (error) {
      const err = error as AxiosError<ApiResponse>;
      return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch role');
    }
  },
);
