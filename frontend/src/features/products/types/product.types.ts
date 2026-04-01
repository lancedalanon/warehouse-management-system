import type { BaseListParams } from '@/types/api.types';

export type Product = Record<string, unknown> & {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  unitType: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductCreatePayload = {
  sku: string;
  name: string;
  description?: string | null;
  unitType: string;
};

export type ProductUpdatePayload = Partial<ProductCreatePayload>;

export interface GetProductsParams extends BaseListParams {
  sku?: string;
  name?: string;
  unitType?: string;
}

export type AddReceivedPayload = {
  quantity: number;
  notes?: string;
};
