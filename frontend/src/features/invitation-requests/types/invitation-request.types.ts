import type { Role } from '@/features/roles/types/role.types';
import type { BaseListParams } from '@/types/api.types';

export type InvitationRequestStatus = 'declined' | 'pending' | null | undefined;

export type InvitationRequest = Record<string, unknown> & {
  id: number;
  email: string;
  token: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  roleId: string | number | null;
  role: Role;
  joinedAt?: string | null;
  declinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface GetInvitationRequestsParams extends BaseListParams {
  email?: string;
  status?: InvitationRequestStatus;
}
