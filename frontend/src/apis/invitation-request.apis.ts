import { axiosInstance as axios } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';
import type {
  InvitationRequest,
  GetInvitationRequestsParams,
} from '@/features/invitation-requests/types/invitation-request.types';

/**
 * GET /api/invitation-requests
 * Paginated list of invitation requests
 */
export const getInvitationRequestsApi = async (
  params?: GetInvitationRequestsParams,
): Promise<{
  data: InvitationRequest[];
  meta: PaginationMeta;
}> => {
  const res = await axios.get<ApiResponse<InvitationRequest[], PaginationMeta>>(
    '/invitation-requests',
    { params },
  );

  return {
    data: res.data.data,
    meta: res.data.meta,
  };
};

/**
 * GET /api/invitation-requests/{id}
 * Get a single invitation request by ID
 */
export const getInvitationRequestApi = async (id: number | string): Promise<InvitationRequest> => {
  const res = await axios.get<ApiResponse<InvitationRequest>>(`/invitation-requests/${id}`);

  return res.data.data;
};

/**
 * PUT /api/invitation-requests/{id}
 * Declined an invitation request by ID
 */
export const declineInvitationRequestApi = async (
  id: number | string,
): Promise<InvitationRequest> => {
  const res = await axios.put<ApiResponse<InvitationRequest>>(`/invitation-requests/${id}/decline`);
  return res.data.data;
};
