import { type FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getUsersThunk, deleteUserThunk } from '@/features/users/stores/user.slice';
import type { User } from '@/features/users/types/user.types';
import { debounce } from 'lodash';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { UserFormDialog } from '@/features/users/components/UserFormDialog';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { toast } from 'sonner';

const UsersPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.users);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<User> | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [openUserFormDialog, setOpenUserFormDialog] = useState(false);
  const [userFormAction, setUserFormAction] = useState<'create' | 'edit'>('create');

  const debouncedFetch = useMemo(
    () =>
      debounce((page: number, limit: number, search: string, sort: SortState<User> | null) => {
        dispatch(
          getUsersThunk({
            page,
            limit,
            search,
            sortBy: sort?.columnKey,
            sortDirection: sort?.direction,
          }),
        );
      }, 500),
    [dispatch],
  );

  useEffect(() => {
    debouncedFetch(page, limit, search, sort);
    return () => {
      debouncedFetch.cancel();
    };
  }, [page, limit, search, sort, debouncedFetch]);

  const handleSortChange = (newSort: SortState<User>) => {
    setSort(newSort);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setLoadingDelete(true);
    try {
      await dispatch(deleteUserThunk(selectedUser.id)).unwrap();
      toast.success('User deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } finally {
      setLoadingDelete(false);
    }
  };

  const columns: TableColumn<User>[] = [
    { key: 'firstName', header: 'First Name', sortable: true },
    { key: 'lastName', header: 'Last Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'createdAt',
      header: 'Creation Date',
      sortable: true,
      render: (row) => {
        if (!row.createdAt) return '-';
        return DayJsHelper.formatDateTime(row.createdAt);
      },
    },
    {
      key: 'roles',
      header: 'Role',
      sortable: false,
      render: (row) => {
        return row.roles?.map((r) => r.name).join(', ') || '-';
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      isActions: true,
      renderActions: (row) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedUser(row);
              setUserFormAction('edit');
              setOpenUserFormDialog(true);
            }}
            title="Edit User"
          >
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              toast.success('Product deleted successfully!');
              setSelectedUser(row);
              setDeleteDialogOpen(true);
            }}
            title="Delete User"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 md:overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button
          size="lg"
          className="text-md flex items-center gap-2 sm:ml-auto"
          onClick={() => {
            setUserFormAction('create');
            setOpenUserFormDialog(true);
          }}
        >
          <Plus className="!size-5" />
          Create User
        </Button>
      </div>

      {/* Table Section */}
      <Card className="flex flex-1 flex-col overflow-y-auto">
        <CardHeader>
          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Data Table */}
          <ScrollArea className="h-92 min-w-full rounded-md border">
            <DataTable<User>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No users found',
                description: 'Try adjusting your search or filters.',
              }}
              onRetry={() => debouncedFetch(page, limit, search, sort)}
              striped
              hoverable
            />
            <ScrollBar
              orientation="horizontal"
              className="h-3 bg-black/20 [&_[data-radix-scroll-area-thumb]]:bg-black [&_[data-radix-scroll-area-thumb]]:hover:bg-black/80"
            />
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <AppPagination
            currentPage={page}
            perPage={limit}
            totalItems={meta?.totalCount ?? 0}
            onPageChange={(newPage) => setPage(newPage)}
            onPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </CardFooter>
      </Card>

      <ConfirmDeleteDialog
        name={selectedUser?.firstName + ' ' + selectedUser?.lastName}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        loading={loadingDelete}
      />

      <UserFormDialog
        open={openUserFormDialog}
        setOpen={setOpenUserFormDialog}
        actionType={userFormAction}
        initialData={userFormAction === 'edit' ? selectedUser! : undefined}
        onSuccess={() => {
          dispatch(
            getUsersThunk({
              page,
              limit,
              search,
              sortBy: sort?.columnKey,
              sortDirection: sort?.direction,
            }),
          );
        }}
      />
    </div>
  );
};

export default UsersPage;
