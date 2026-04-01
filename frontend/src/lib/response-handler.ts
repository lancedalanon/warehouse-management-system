import { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api.types';

export function handleApiError(error: AxiosError<ApiResponse>): never {
  if (!error.response) {
    toast.error('Network error. Please try again.');
    throw error;
  }

  const { status, data } = error.response;

  if (data?.status === 'VALIDATION_ERROR' && Array.isArray(data.error)) {
    throw error;
  }

  const message = data?.message || 'Something went wrong. Please try again.';

  switch (status) {
    case 401:
    case 409:
    case 500:
      toast.error(message);
      break;
    case 403:
      toast.warning(message);
      break;
    default:
      toast(message);
  }

  throw data;
}
