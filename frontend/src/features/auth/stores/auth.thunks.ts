import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import {
  loginApi,
  logoutApi,
  refreshApi,
  requestInvitationApi,
  forgotPasswordApi,
  changePasswordApi,
  updateAccountApi,
  changeEmailApi,
  updatePasswordApi,
  verifyEmailApi,
  requestEmailVerificationApi,
} from '@/apis/auth.apis';
import type {
  ChangeEmailPayload,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RequestInvitationPayload,
  UpdateAccountInfoPayload,
  UpdatePasswordPayload,
} from '@/features/auth/types/auth.types';
import type { ApiResponse, ValidationErrorItem } from '@/types/api.types';
import { meApi } from '@/apis/auth.apis';
import type { User } from '@/features/users/types/user.types';

export const loginThunk = createAsyncThunk<LoginResponse, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      return await loginApi(payload);
    } catch (error) {
      const err = error as AxiosError<ApiResponse<null, unknown, unknown>>;
      return rejectWithValue(err.response?.data?.message ?? 'Login failed');
    }
  },
);

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
    } catch (error) {
      const err = error as AxiosError<ApiResponse<null, unknown, unknown>>;
      return rejectWithValue(err.response?.data?.message ?? 'Logout failed');
    }
  },
);

export const refreshThunk = createAsyncThunk<LoginResponse, void, { rejectValue: string }>(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshApi();
      return response.data.data as LoginResponse;
    } catch (error) {
      const err = error as AxiosError<ApiResponse<null, unknown, unknown>>;
      return rejectWithValue(err.response?.data?.message ?? 'Refresh failed');
    }
  },
);

export const requestInvitationThunk = createAsyncThunk<
  void,
  RequestInvitationPayload,
  { rejectValue: string }
>('auth/request-invitation', async (payload, { rejectWithValue }) => {
  try {
    await requestInvitationApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Invitation request failed');
  }
});

export const forgotPasswordThunk = createAsyncThunk<
  void,
  ForgotPasswordPayload,
  { rejectValue: string }
>('auth/forgot-password', async (payload, { rejectWithValue }) => {
  try {
    await forgotPasswordApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Password reset request failed');
  }
});

export const changePasswordThunk = createAsyncThunk<
  void,
  ChangePasswordPayload,
  { rejectValue: string }
>('auth/change-password', async (payload, { rejectWithValue }) => {
  try {
    await changePasswordApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Password change failed');
  }
});

export const meThunk = createAsyncThunk<LoginResponse, void, { rejectValue: string }>(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      return await meApi();
    } catch (error) {
      const err = error as AxiosError<ApiResponse>;
      return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch user');
    }
  },
);

export const updateAccountInfoThunk = createAsyncThunk<
  User,
  UpdateAccountInfoPayload,
  { rejectValue: ValidationErrorItem[] }
>('auth/update-account', async (payload, { rejectWithValue }) => {
  try {
    return await updateAccountApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const changeEmailThunk = createAsyncThunk<
  User,
  ChangeEmailPayload,
  { rejectValue: ValidationErrorItem[] }
>('auth/change-email', async (payload, { rejectWithValue }) => {
  try {
    return await changeEmailApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const updatePasswordThunk = createAsyncThunk<
  User,
  UpdatePasswordPayload,
  { rejectValue: ValidationErrorItem[] }
>('auth/update-password', async (payload, { rejectWithValue }) => {
  try {
    return await updatePasswordApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse<null, null, ValidationErrorItem[]>>;

    const data = err.response?.data;

    if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
      return rejectWithValue(data.error);
    }

    throw error;
  }
});

export const requestEmailVerificationThunk = createAsyncThunk<
  void,
  { email: string },
  { rejectValue: string }
>('auth/request-email-verification', async (payload, { rejectWithValue }) => {
  try {
    await requestEmailVerificationApi(payload);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to request email verification');
  }
});

export const verifyEmailThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  'auth/verify-email',
  async (token, { rejectWithValue }) => {
    try {
      const data = await verifyEmailApi(token);
      return data.message;
    } catch (error) {
      const err = error as AxiosError<ApiResponse>;
      return rejectWithValue(err.response?.data?.message ?? 'Failed to verify email');
    }
  },
);
