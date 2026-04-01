import type { Location } from '@/features/locations/types/location.types';
import type { ValidationErrorItem } from '@/types/api.types';
import type { PaginationMeta } from '@/types/pagination.types';

export type LocationsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LocationsState {
  items: Location[];
  meta: PaginationMeta | null;
  status: {
    fetch: LocationsStatus;
    create: LocationsStatus;
    update: LocationsStatus;
    delete: LocationsStatus;
  };
  error: {
    fetch?: string;
    create?: ValidationErrorItem[];
    update?: ValidationErrorItem[];
    delete?: string;
  };
  singleLocation?: Location;
}
