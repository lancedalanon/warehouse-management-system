import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api.types';
import { exportDashboardApi, getDashboardApi } from '../../../apis/dashboard.apis';
import type { DashboardData, GetDashboardParams } from '../types/dashboard.types';

export const getDashboardThunk = createAsyncThunk<
  DashboardData,
  GetDashboardParams | undefined,
  { rejectValue: string }
>('dashboard/getData', async (params, { rejectWithValue }) => {
  try {
    return await getDashboardApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch dashboard data');
  }
});

export const exportDashboardThunk = createAsyncThunk<
  { url: string },
  GetDashboardParams | undefined,
  { rejectValue: string }
>('dashboard/export', async (params, { rejectWithValue }) => {
  try {
    return await exportDashboardApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to export dashboard');
  }
});
