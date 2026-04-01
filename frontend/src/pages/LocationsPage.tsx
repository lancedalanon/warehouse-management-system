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
import { getLocationsThunk, deleteLocationThunk } from '@/features/locations/stores/location.slice';
import type { Location } from '@/features/locations/types/location.types';
import { debounce } from 'lodash';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { LocationFormDialog } from '@/features/locations/components/LocationFormDialog';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { AuthorizeRoles } from '@/components/AuthorizeRoles';
import { Role } from '@/enums/Role';
import { toast } from 'sonner';

const LocationsPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.locations);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<Location> | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [openLocationFormDialog, setOpenLocationFormDialog] = useState(false);
  const [locationFormAction, setLocationFormAction] = useState<'create' | 'edit'>('create');

  const debouncedFetch = useMemo(
    () =>
      debounce((page: number, limit: number, search: string, sort: SortState<Location> | null) => {
        dispatch(
          getLocationsThunk({
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

  const handleSortChange = (newSort: SortState<Location>) => {
    setSort(newSort);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocation) return;
    setLoadingDelete(true);
    try {
      await dispatch(deleteLocationThunk(selectedLocation.id)).unwrap();
      toast.success('Location deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedLocation(null);
    } finally {
      setLoadingDelete(false);
    }
  };

  const columns: TableColumn<Location>[] = [
    { key: 'code', header: 'Code', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'capacity', header: 'Capacity', sortable: true },
    {
      key: 'createdAt',
      header: 'Creation Date',
      sortable: true,
      render: (rowData: { createdAt: string | Date }) => {
        if (!rowData.createdAt) return '-';
        return DayJsHelper.formatDateTime(rowData.createdAt);
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      isActions: true,
      renderActions: (row) => (
        <div className="flex justify-center gap-2">
          <AuthorizeRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedLocation(row);
                setLocationFormAction('edit');
                setOpenLocationFormDialog(true);
              }}
              title="Edit Location"
            >
              <Edit className="h-4 w-4 text-blue-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedLocation(row);
                setDeleteDialogOpen(true);
              }}
              title="Delete Location"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </AuthorizeRoles>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 md:overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Locations</h1>
        <AuthorizeRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]}>
          <Button
            size="lg"
            className="text-md flex items-center gap-2 sm:ml-auto"
            onClick={() => {
              setLocationFormAction('create');
              setOpenLocationFormDialog(true);
            }}
          >
            <Plus className="!size-5" />
            Create Location
          </Button>
        </AuthorizeRoles>
      </div>

      {/* Table Section */}
      <Card className="flex flex-1 flex-col overflow-y-auto">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search locations..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-92 min-w-full rounded-md border">
            <DataTable<Location>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No locations found',
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
        name={selectedLocation?.name}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        loading={loadingDelete}
      />

      <LocationFormDialog
        open={openLocationFormDialog}
        setOpen={setOpenLocationFormDialog}
        actionType={locationFormAction}
        initialData={locationFormAction === 'edit' ? selectedLocation! : undefined}
        onSuccess={() => {
          dispatch(
            getLocationsThunk({
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

export default LocationsPage;
