import type { User } from '@/features/users/types/user.types';
import type { BaseListParams } from '@/types/api.types';

export type AuditValue = string | number | boolean | null | undefined;

export interface AuditLog extends Record<string, unknown> {
  id: number | string;
  event: string;
  description: string;
  auditableType: string;
  auditableId: number | string;
  userId: number | null;
  user: User | null;
  oldValues: Record<string, AuditValue> | null;
  newValues: Record<string, AuditValue> | null;
  createdAt: string;
}

export interface GetAuditLogsParams extends BaseListParams {
  auditableType?: string;
  auditableId?: number | string;
  userId?: number;
  event?: string;
}
