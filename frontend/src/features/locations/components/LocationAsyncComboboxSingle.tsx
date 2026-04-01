import { type FC, useCallback } from 'react';
import AsyncComboboxSingle from '@/components/AsyncComboboxSingle';
import { getLocationsThunk } from '@/features/locations/stores/location.slice';
import { useAppDispatch } from '@/stores/hooks';

interface LocationAsyncComboboxSingleProps {
  selectedLocationId: string | number | null;
  setSelectedLocationId: (id: string | number | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

const LocationAsyncComboboxSingle: FC<LocationAsyncComboboxSingleProps> = ({
  selectedLocationId,
  setSelectedLocationId,
  disabled = false,
  label = '',
  placeholder = 'Select a location...',
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
    <AsyncComboboxSingle
      selectedValue={selectedLocationId}
      onSelectionChange={setSelectedLocationId}
      fetchFunction={fetchLocations}
      disabled={disabled}
      label={label}
      placeholder={placeholder}
    />
  );
};

export default LocationAsyncComboboxSingle;
