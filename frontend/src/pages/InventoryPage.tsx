'use client';

import { type FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import {
  getInventoriesThunk,
  deleteInventoryThunk,
} from '@/features/inventories/stores/inventory.slice';
import type { Inventory } from '@/features/inventories/types/inventory.types';
import { debounce } from 'lodash';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { InventoryFormDialog } from '@/features/inventories/components/InventoryFormDialog';
import { ViewInventoryMovementDialog } from '@/features/inventory-movements/components/ViewInventoryMovementDialog';
import ProductAsyncCombobox from '@/features/products/components/ProductAsyncCombobox';
import LocationAsyncCombobox from '@/features/locations/components/LocationAsyncCombobox';
import { toast } from 'sonner';

const InventoryPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.inventories);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<Inventory> | null>(null);

  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [openInventoryFormDialog, setOpenInventoryFormDialog] = useState(false);
  const [inventoryFormAction, setInventoryFormAction] = useState<'create' | 'edit'>('create');

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);

  const [openMovementDialog, setOpenMovementDialog] = useState(false);

  // Debounced fetch
  const debouncedFetch = useMemo(
    () =>
      debounce(
        (
          page: number,
          limit: number,
          search: string,
          sort: SortState<Inventory> | null,
          productIds: number[],
          locationIds: number[],
        ) => {
          dispatch(
            getInventoriesThunk({
              page,
              limit,
              search,
              sortBy: sort?.columnKey != null ? String(sort.columnKey) : undefined,
              sortDirection: sort?.direction,
              productIds,
              locationIds,
            }),
          );
        },
        500,
      ),
    [dispatch],
  );

  useEffect(() => {
    debouncedFetch(page, limit, search, sort, selectedProducts, selectedLocations);
    return () => {
      debouncedFetch.cancel();
    };
  }, [page, limit, search, sort, debouncedFetch, selectedProducts, selectedLocations]);

  const handleSortChange = (newSort: SortState<Inventory>) => {
    setSort(newSort);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInventory) return;
    setLoadingDelete(true);
    try {
      await dispatch(deleteInventoryThunk(selectedInventory.id)).unwrap();
      toast.success('Inventory deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedInventory(null);
    } finally {
      setLoadingDelete(false);
    }
  };

  const columns: TableColumn<Inventory>[] = [
    { key: 'product.sku', header: 'SKU', sortable: true },
    { key: 'product.name', header: 'Product', sortable: true },
    { key: 'location.name', header: 'Location', sortable: true },
    {
      key: 'storedQuantity',
      header: 'On Hand',
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      isActions: true,
      renderActions: (row) => (
        <div className="flex justify-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setSelectedInventory(row);
              setOpenMovementDialog(true);
            }}
            title="View Inventory Actions"
          >
            <Eye className="h-4 w-4 text-gray-700" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedInventory(row);
              setInventoryFormAction('edit');
              setOpenInventoryFormDialog(true);
            }}
            title="Edit Inventory Item"
          >
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedInventory(row);
              setDeleteDialogOpen(true);
            }}
            title="Delete Inventory Item"
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
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Button
          size="lg"
          className="text-md flex items-center gap-2 sm:ml-auto"
          onClick={() => {
            setInventoryFormAction('create');
            setOpenInventoryFormDialog(true);
          }}
        >
          <Plus className="!size-5" />
          Add Inventory Item
        </Button>
      </div>

      {/* Table Section */}
      <Card className="flex flex-col overflow-y-auto">
        <CardHeader>
          <div className="relative flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search inventory..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-64">
              <ProductAsyncCombobox
                selectedProducts={selectedProducts}
                setSelectedProducts={setSelectedProducts}
                maxBadgeChars={20}
              />
            </div>

            <div className="w-full sm:w-64">
              <LocationAsyncCombobox
                selectedLocations={selectedLocations}
                setSelectedLocations={setSelectedLocations}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-92 min-w-full rounded-md border">
            <DataTable<Inventory>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No items found',
                description: 'Try adjusting your search or filters.',
              }}
              onRetry={() =>
                debouncedFetch(page, limit, search, sort, selectedProducts, selectedLocations)
              }
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
        name={selectedInventory?.product?.name}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        loading={loadingDelete}
      />

      <InventoryFormDialog
        open={openInventoryFormDialog}
        setOpen={setOpenInventoryFormDialog}
        actionType={inventoryFormAction}
        initialData={inventoryFormAction === 'edit' ? selectedInventory! : undefined}
        onSuccess={() => {
          dispatch(
            getInventoriesThunk({
              page,
              limit,
              search,
              sortBy: sort?.columnKey != null ? String(sort.columnKey) : undefined,
              sortDirection: sort?.direction,
            }),
          );
        }}
      />

      <ViewInventoryMovementDialog
        open={openMovementDialog}
        setOpen={setOpenMovementDialog}
        inventory={selectedInventory}
      />
    </div>
  );
};

export default InventoryPage;
