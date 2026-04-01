import type { BaseListParams } from '@/types/api.types';

export type Role = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export interface GetRolesParams extends BaseListParams {
  code?: string;
  name?: string;
}
