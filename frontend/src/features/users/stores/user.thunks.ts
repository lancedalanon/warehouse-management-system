import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse, ValidationErrorItem } from '@/types/api.types';
import {
  getUsersApi,
  getUserApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from '@/apis/user.apis';
import type {
  User,
  UserCreatePayload,
  UserUpdatePayload,
  GetUsersParams,
} from '@/features/users/types/user.types';
import type { PaginationMeta } from '@/types/pagination.types';

/* GET USERS (paginated) */
export const getUsersThunk = createAsyncThunk<
  { data: User[]; meta: PaginationMeta },
  GetUsersParams | undefined,
  { rejectValue: string }
>('users/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getUsersApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch users');
  }
});

/* GET SINGLE USER */
export const getUserThunk = createAsyncThunk<User, number | string, { rejectValue: string }>(
  'users/getOne',
  async (id, { rejectWithValue }) => {
    try {
      return await getUserApi(id);
    } catch (error) {
      const err = error as AxiosError<ApiResponse>;
      return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch user');
    }
  },
);

/* CREATE USER */
export const createUserThunk = createAsyncThunk<
  User,
  UserCreatePayload,
  { rejectValue: ValidationErrorItem[] }
>('users/create', async (payload, { rejectWithValue }) => {
  try {
    return await createUserApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

/* UPDATE USER */
export const updateUserThunk = createAsyncThunk<
  User,
  { id: number | string; payload: UserUpdatePayload },
  { rejectValue: ValidationErrorItem[] }
>('users/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateUserApi(id, payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

/* DELETE USER */
export const deleteUserThunk = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('users/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteUserApi(id);
    return id;
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to delete user');
  }
});
