import type { SortDirection } from '../api.types';

export interface SortState<T = unknown> {
  columnKey?: keyof T | undefined;
  direction?: SortDirection;
}

export interface TableColumn<T extends Record<string, unknown>> {
  key: keyof T | string;
  header: string | React.ReactNode;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
  isActions?: boolean;
  actionField?: keyof T;
  renderActions?: (row: T) => React.ReactNode;
}
