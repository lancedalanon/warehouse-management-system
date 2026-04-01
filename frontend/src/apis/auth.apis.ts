import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
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
import type { User } from '@/features/users/types/user.types';

export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await axios.post<ApiResponse<LoginResponse>>('/auth/login', payload);

  return res.data.data;
};

export const logoutApi = async (): Promise<void> => {
  await axios.post<ApiResponse>('/auth/logout');
};

export const refreshApi = async () => await axios.post<ApiResponse>('/auth/refresh');

export const requestInvitationApi = async (payload: RequestInvitationPayload): Promise<void> => {
  await axios.post<ApiResponse>('/auth/request-invitation', payload);
};

export const forgotPasswordApi = async (payload: ForgotPasswordPayload): Promise<void> => {
  await axios.post<ApiResponse>('/auth/forgot-password', payload);
};

export const changePasswordApi = async (payload: ChangePasswordPayload): Promise<void> => {
  const { email, token, password, confirmPassword } = payload;

  await axios.post<ApiResponse>(
    '/auth/change-password',
    { password, confirmPassword },
    {
      params: { email, token },
    },
  );
};

export const meApi = async () => {
  const res = await axios.get<ApiResponse<LoginResponse>>('/auth/me');
  return res.data.data;
};

export const updateAccountApi = async (payload: UpdateAccountInfoPayload): Promise<User> => {
  const res = await axios.patch<ApiResponse<User>>('/auth/account', payload);
  return res.data.data;
};

export const changeEmailApi = async (payload: ChangeEmailPayload): Promise<User> => {
  const res = await axios.patch<ApiResponse<User>>('/auth/change-email', payload);
  return res.data.data;
};

export const updatePasswordApi = async (payload: UpdatePasswordPayload): Promise<User> => {
  const res = await axios.patch<ApiResponse<User>>('/auth/update-password', payload);
  return res.data.data;
};

export const requestEmailVerificationApi = async (payload: { email: string }): Promise<void> => {
  await axios.post<ApiResponse>('/auth/request-email-verification', payload);
};

export const verifyEmailApi = async (token: string): Promise<{ message: string }> => {
  const res = await axios.get<ApiResponse<{ message: string }>>('/auth/verify-email', {
    params: { token },
  });
  return res.data.data;
};
