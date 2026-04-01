export type PaginationRequest<T> = {
  page?: number;
  limit?: number;
  sortBy?: keyof T;
  sortDirection?: 'ASC' | 'DESC';
} & Partial<Record<keyof T, string>>;
