import type { User } from '@/features/users/types/user.types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AccessToken {
  token: string;
  expiredAt: string;
}

export interface LoginResponse {
  user: User;
  accessToken: AccessToken;
}

export interface RequestInvitationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ChangePasswordPayload {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateAccountInfoPayload {
  firstName: string;
  middleName?: string | undefined | null;
  lastName?: string | undefined | null;
  suffix?: string | undefined | null;
}

export interface ChangeEmailPayload {
  email: string;
  currentPassword: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
