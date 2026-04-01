import type { User } from '@/features/users/types/user.types';
import type { ValidationErrorItem } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type UsersStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UsersState {
  items: User[];
  meta: PaginationMeta | null;
  status: {
    fetch: UsersStatus;
    create: UsersStatus;
    update: UsersStatus;
    delete: UsersStatus;
  };
  error: {
    fetch?: string;
    create?: ValidationErrorItem[];
    update?: ValidationErrorItem[];
    delete?: string;
  };
  singleUser?: User;
}
