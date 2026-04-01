import type { PaginationMeta } from '@/types/pagination.types';
import type { Role } from '@/features/roles/types/role.types';

export type RolesStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RolesState {
  items: Role[];
  meta: PaginationMeta | null;
  status: {
    fetch: RolesStatus;
  };
  error: {
    fetch?: string;
  };
  singleRole?: Role;
}
