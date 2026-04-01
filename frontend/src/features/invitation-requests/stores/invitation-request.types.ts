import type { PaginationMeta } from '@/types/pagination.types';
import type { InvitationRequest } from '../types/invitation-request.types';

export type InvitationRequestsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface InvitationRequestsState {
  items: InvitationRequest[];
  meta: PaginationMeta | null;
  status: {
    fetch: InvitationRequestsStatus;
    decline: 'idle' | 'loading' | 'success' | 'error';
  };
  error: {
    fetch?: string;
    decline?: string;
  };
  singleInvitationRequest?: InvitationRequest;
}
