import type { AuditLog } from '@/features/audit-logs/types/audit-log.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type AuditLogsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuditLogsState {
  items: AuditLog[];
  meta: PaginationMeta | null;
  status: {
    fetch: AuditLogsStatus;
    single: AuditLogsStatus;
  };
  error: {
    fetch?: string;
    single?: string;
  };
  singleAuditLog?: AuditLog;
}
