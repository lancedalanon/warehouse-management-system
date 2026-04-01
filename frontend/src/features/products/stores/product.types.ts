import type { Product } from '@/features/products/types/product.types';
import type { ValidationErrorItem } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type ProductsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ProductsState {
  items: Product[];
  meta: PaginationMeta | null;
  status: {
    fetch: ProductsStatus;
    create: ProductsStatus;
    update: ProductsStatus;
    delete: ProductsStatus;
  };
  error: {
    fetch?: string;
    create?: ValidationErrorItem[];
    update?: ValidationErrorItem[];
    delete?: string;
  };
  singleProduct?: Product;
}
