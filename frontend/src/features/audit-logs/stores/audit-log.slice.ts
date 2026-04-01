import { createSlice } from '@reduxjs/toolkit';
import type { AuditLog } from '@/features/audit-logs/types/audit-log.types';
import { getAuditLogsThunk, getAuditLogThunk } from './audit-log.thunks';

export interface AuditLogsState {
  items: AuditLog[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
  } | null;
  status: {
    fetch: 'idle' | 'loading' | 'success' | 'error';
    single: 'idle' | 'loading' | 'success' | 'error';
  };
  error: {
    fetch?: string;
    single?: string;
  };
  singleAuditLog?: AuditLog;
}

const initialState: AuditLogsState = {
  items: [],
  meta: null,
  status: {
    fetch: 'idle',
    single: 'idle',
  },
  error: {},
  singleAuditLog: undefined,
};

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState,
  reducers: {
    clearAuditLogsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      /* GET AUDIT LOGS (LIST) */
      .addCase(getAuditLogsThunk.pending, (state) => {
        state.status.fetch = 'loading';
        state.error.fetch = undefined;
      })
      .addCase(getAuditLogsThunk.fulfilled, (state, action) => {
        state.status.fetch = 'success';
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(getAuditLogsThunk.rejected, (state, action) => {
        state.status.fetch = 'error';
        state.error.fetch = action.payload as string;
      })

      /* GET AUDIT LOG (SINGLE) */
      .addCase(getAuditLogThunk.pending, (state) => {
        state.status.single = 'loading';
        state.error.single = undefined;
      })
      .addCase(getAuditLogThunk.fulfilled, (state, action) => {
        state.status.single = 'success';
        state.singleAuditLog = action.payload;

        const index = state.items.findIndex((log) => log.id === action.payload.id);

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(getAuditLogThunk.rejected, (state, action) => {
        state.status.single = 'error';
        state.error.single = action.payload as string;
      });
  },
});

export const { clearAuditLogsState } = auditLogsSlice.actions;

export { getAuditLogsThunk, getAuditLogThunk };

export default auditLogsSlice.reducer;
