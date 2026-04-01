import type { BaseListParams } from '@/types/api.types';

export type Location = Record<string, unknown> & {
  id: number;
  code: string;
  name: string;
  type: string;
  capacity?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LocationCreatePayload = {
  code: string;
  name: string;
  type: string;
  capacity?: string | null;
};

export type LocationUpdatePayload = Partial<LocationCreatePayload>;

export interface GetLocationsParams extends BaseListParams {
  code?: string;
  name?: string;
  type?: string;
}
