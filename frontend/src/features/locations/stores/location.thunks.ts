import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse, ValidationErrorItem } from '@/types/api.types';
import {
  getLocationsApi,
  createLocationApi,
  updateLocationApi,
  deleteLocationApi,
  getLocationApi,
} from '@/apis/location.apis';
import type {
  Location,
  LocationCreatePayload,
  LocationUpdatePayload,
} from '@/features/locations/types/location.types';
import type { GetLocationsParams } from '@/features/locations/types/location.types';
import type { PaginationMeta } from '@/types/pagination.types';

export const getLocationsThunk = createAsyncThunk<
  { data: Location[]; meta: PaginationMeta },
  GetLocationsParams | undefined,
  { rejectValue: string }
>('locations/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getLocationsApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch locations');
  }
});

export const getLocationThunk = createAsyncThunk<
  Location,
  number | string,
  { rejectValue: string }
>('locations/getOne', async (id, { rejectWithValue }) => {
  try {
    return await getLocationApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch location');
  }
});

export const createLocationThunk = createAsyncThunk<
  Location,
  LocationCreatePayload,
  { rejectValue: ValidationErrorItem[] }
>('locations/create', async (payload, { rejectWithValue }) => {
  try {
    return await createLocationApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const updateLocationThunk = createAsyncThunk<
  Location,
  { id: number | string; payload: LocationUpdatePayload },
  { rejectValue: ValidationErrorItem[] }
>('locations/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await updateLocationApi(id, payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const deleteLocationThunk = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>('locations/delete', async (id, { rejectWithValue }) => {
  try {
    await deleteLocationApi(id);
    return id;
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to delete location');
  }
});
