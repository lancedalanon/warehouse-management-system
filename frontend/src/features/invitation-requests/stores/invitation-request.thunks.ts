import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api.types';
import {
  getInvitationRequestsApi,
  getInvitationRequestApi,
  declineInvitationRequestApi,
} from '@/apis/invitation-request.apis';
import type {
  InvitationRequest,
  GetInvitationRequestsParams,
} from '@/features/invitation-requests/types/invitation-request.types';
import type { PaginationMeta } from '@/types/pagination.types';

export const getInvitationRequestsThunk = createAsyncThunk<
  { data: InvitationRequest[]; meta: PaginationMeta },
  GetInvitationRequestsParams | undefined,
  { rejectValue: string }
>('invitationRequests/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getInvitationRequestsApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch invitation requests');
  }
});

export const getInvitationRequestThunk = createAsyncThunk<
  InvitationRequest,
  number | string,
  { rejectValue: string }
>('invitationRequests/getOne', async (id, { rejectWithValue }) => {
  try {
    return await getInvitationRequestApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch invitation request');
  }
});
export const declineInvitationRequestThunk = createAsyncThunk<
  InvitationRequest,
  number | string,
  { rejectValue: string }
>('invitationRequests/decline', async (id, { rejectWithValue }) => {
  try {
    return await declineInvitationRequestApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to decline invitation request');
  }
});
