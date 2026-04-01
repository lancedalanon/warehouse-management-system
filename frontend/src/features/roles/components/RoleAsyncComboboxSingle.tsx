import { type FC, useCallback } from 'react';
import AsyncComboboxSingle from '@/components/AsyncComboboxSingle';
import { getRolesThunk } from '@/features/roles/stores/role.slice';
import { useAppDispatch } from '@/stores/hooks';

interface RoleAsyncComboboxSingleProps {
  selectedRoleId: string | number | null;
  setSelectedRoleId: (id: string | number | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

const RoleAsyncComboboxSingle: FC<RoleAsyncComboboxSingleProps> = ({
  selectedRoleId,
  setSelectedRoleId,
  disabled = false,
  label = '',
  placeholder = 'Select a role...',
}) => {
  const dispatch = useAppDispatch();

  const fetchRoles = useCallback(
    async ({ page, limit, search }: { page: number; limit: number; search: string }) => {
      try {
        const result = await dispatch(
          getRolesThunk({
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
        console.error('Failed to fetch roles:', error);
        return {
          items: [],
          meta: { hasNextPage: false },
        };
      }
    },
    [dispatch],
  );

  return (
    <AsyncComboboxSingle
      selectedValue={selectedRoleId}
      onSelectionChange={setSelectedRoleId}
      fetchFunction={fetchRoles}
      disabled={disabled}
      label={label}
      placeholder={placeholder}
    />
  );
};

export default RoleAsyncComboboxSingle;
