import type { User } from '@/features/users/types/user.types';
import type { ValidationErrorItem } from '@/types/api.types';
import type { AccessToken } from '../types/auth.types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error' | 'success';

export interface AuthState {
  user: User | null;
  accessToken: AccessToken | null;
  refreshing: boolean;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  loginStatus: 'idle' | 'loading' | 'error';
  forgotPasswordStatus: 'idle' | 'loading' | 'success' | 'error';
  resetPasswordStatus: 'idle' | 'loading' | 'success' | 'error';
  requestInvitationStatus: 'idle' | 'loading' | 'success' | 'error';
  updateAccountInfoStatus: 'idle' | 'loading' | 'success' | 'error';
  changeEmailStatus: 'idle' | 'loading' | 'success' | 'error';
  updatePasswordStatus: 'idle' | 'loading' | 'success' | 'error';
  requestEmailVerificationStatus: 'idle' | 'loading' | 'success' | 'error';
  verifyEmailStatus: 'idle' | 'loading' | 'success' | 'error';
  verifyEmailMessage: string | null;
  error: string | null;
  updateAccountInfoError?: ValidationErrorItem[] | null;
  changeEmailError?: ValidationErrorItem[] | null;
  updatePasswordError?: ValidationErrorItem[] | null;
}
