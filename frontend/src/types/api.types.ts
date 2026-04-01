/**
 * Generic API response envelope
 * TData payload (single object, array, null, etc.)
 * TMeta pagination or any metadata
 * TError backend-specific error details
 */
export interface ApiResponse<TData = unknown, TMeta = unknown, TError = unknown> {
  success: boolean;
  status: string;
  message: string;
  data: TData;
  meta: TMeta;
  error: TError;
  requestId: string;
  timestamp: string;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export type SortDirection = 'ASC' | 'DESC' | undefined;

export interface BaseListParams {
  page?: number;
  limit?: number;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortDirection?: SortDirection;
}
