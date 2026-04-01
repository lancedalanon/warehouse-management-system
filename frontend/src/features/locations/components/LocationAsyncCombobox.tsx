import { type FC, useCallback } from 'react';
import AsyncComboboxMultiple from '@/components/AsyncComboboxMultiple';
import { getLocationsThunk } from '@/features/locations/stores/location.slice';
import { useAppDispatch } from '@/stores/hooks';

interface LocationAsyncComboboxProps {
  selectedLocations: number[];
  setSelectedLocations: (ids: number[]) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  maxBadgeChars?: number;
}

const LocationAsyncCombobox: FC<LocationAsyncComboboxProps> = ({
  selectedLocations,
  setSelectedLocations,
  disabled = false,
  label = '',
  placeholder = 'Search locations...',
  maxBadgeChars = 25,
}) => {
  const dispatch = useAppDispatch();

  const fetchLocations = useCallback(
    async ({ page, limit, search }: { page: number; limit: number; search: string }) => {
      try {
        const result = await dispatch(
          getLocationsThunk({
            page,
            limit,
            search,
          }),
        ).unwrap();

        return {
          items: result.data,
          meta: {
            hasNextPage: result.meta?.hasNextPage ?? false,
          },
        };
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        return {
          items: [],
          meta: {
            hasNextPage: false,
          },
        };
      }
    },
    [dispatch],
  );

  return (
    <AsyncComboboxMultiple
      selectedValues={selectedLocations}
      onSelectionChange={setSelectedLocations}
      fetchFunction={fetchLocations}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      maxBadgeChars={maxBadgeChars}
    />
  );
};

export default LocationAsyncCombobox;
