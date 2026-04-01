import type { Role } from '@/features/roles/types/role.types';
import type { BaseListParams } from '@/types/api.types';

export type User = Record<string, unknown> & {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  email: string;
  roles: Role[] | null;
  createdAt?: Date | string;
  emailVerifiedAt?: Date | string | null;
};

export type UserCreatePayload = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  token?: string;
  roleId?: string | number;
};

export type UserUpdatePayload = Partial<UserCreatePayload>;

export interface GetUsersParams extends BaseListParams {
  firstName?: string;
  lastName?: string;
  email?: string;
}
