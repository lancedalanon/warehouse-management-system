import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

import { getAuditLogsApi, getAuditLogApi } from '@/apis/audit-log.apis';

import type { AuditLog, GetAuditLogsParams } from '@/features/audit-logs/types/audit-log.types';

/* GET AUDIT LOGS (paginated) */
export const getAuditLogsThunk = createAsyncThunk<
  { data: AuditLog[]; meta: PaginationMeta },
  GetAuditLogsParams,
  { rejectValue: string }
>('auditLogs/getAll', async (params, { rejectWithValue }) => {
  try {
    return await getAuditLogsApi(params);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch audit logs');
  }
});

/* GET SINGLE AUDIT LOG */
export const getAuditLogThunk = createAsyncThunk<
  AuditLog,
  number | string,
  { rejectValue: string }
>('auditLogs/getOne', async (id, { rejectWithValue }) => {
  try {
    return await getAuditLogApi(id);
  } catch (error) {
    const err = error as AxiosError<ApiResponse>;
    return rejectWithValue(err.response?.data?.message ?? 'Failed to fetch audit log');
  }
});
