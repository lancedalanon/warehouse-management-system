import axios, {
  type InternalAxiosRequestConfig,
  type AxiosInstance,
  type AxiosResponse,
  AxiosError,
} from 'axios';
import type { ApiResponse } from '@/types/api.types';
import { handleApiError } from '@/lib/response-handler';

/**
 * Extend AxiosRequestConfig to include our custom _retry property
 */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Axios instance
 */
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

/**
 * Create an interceptor factory
 * @param getToken - function that returns current access token
 * @param onRefresh - function that refreshes token
 * @param onLogout - function that logs user out
 */
export const attachInterceptors = ({
  getToken,
  onRefresh,
  onLogout,
}: {
  getToken: () => string | null;
  onRefresh: () => Promise<string>;
  onLogout: () => void;
}) => {
  // Request interceptor: attach current token
  axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: handle 401 & refresh
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiResponse>) => {
      const originalRequest = error.config as CustomAxiosRequestConfig;

      if (!originalRequest || !error.response) return handleApiError(error);

      const status = error.response.status;
      const isUnauthorized = status === 401;
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      const isForgotPasswordRequest = originalRequest.url?.includes('/auth/forgot-password');
      const isResetPasswordRequest = originalRequest.url?.includes('/auth/reset-password');
      const isRequestInvitationRequest = originalRequest.url?.includes('/auth/request-invitation');

      if (
        isLoginRequest ||
        isForgotPasswordRequest ||
        isResetPasswordRequest ||
        isRequestInvitationRequest
      )
        return handleApiError(error);

      if (isUnauthorized && !isRefreshRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await onRefresh();
          // retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          onLogout();
          return Promise.reject(refreshError);
        }
      }

      if (isUnauthorized && isRefreshRequest) {
        onLogout();
        return Promise.reject(error);
      }

      return handleApiError(error);
    },
  );
};
