'use client';

import { type FC, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DataTable } from '@/components/DataTable';
import type { SortState, TableColumn } from '@/types/components/data-table.types';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import type { Inventory } from '@/features/inventories/types/inventory.types';
import { getInventoriesThunk } from '@/features/inventories/stores/inventory.thunks';
import { debounce } from 'lodash';
import ProductAsyncCombobox from '@/features/products/components/ProductAsyncCombobox';
import LocationAsyncCombobox from '@/features/locations/components/LocationAsyncCombobox';
import { Search, X, PackageCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  onAddItems?: (selectedInventories: Inventory[]) => void;
}

export const InventorySelectionDialog: FC<Props> = ({ open, setOpen, onAddItems }) => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.inventories);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<Inventory> | null>(null);

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
  const [selectedInventories, setSelectedInventories] = useState<Inventory[]>([]);

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

  const handleAddItems = () => {
    if (onAddItems) onAddItems(selectedInventories);
    setSelectedInventories([]);
    setSelectedProducts([]);
    setSelectedLocations([]);
    setSearch('');
    setPage(1);
    setSort(null);
    setOpen(false);
  };

  const toggleInventory = (inventory: Inventory) => {
    setSelectedInventories((prev) => {
      if (prev.find((i) => i.id === inventory.id)) {
        return prev.filter((i) => i.id !== inventory.id);
      }
      return [...prev, inventory];
    });
  };

  const isAllSelected = items.length > 0 && items.every((item) => selectedInventories.find((i) => i.id === item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Deselect only items on the current page
      setSelectedInventories((prev) => prev.filter((i) => !items.find((item) => item.id === i.id)));
    } else {
      // Add all items on the current page (avoid duplicates)
      setSelectedInventories((prev) => {
        const newItems = items.filter((item) => !prev.find((i) => i.id === item.id));
        return [...prev, ...newItems];
      });
    }
  };

  const clearAll = () => setSelectedInventories([]);

  const columns: TableColumn<Inventory>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (row: Inventory) => {
        const isSelected = !!selectedInventories.find((i) => i.id === row.id);
        return (
        <div className="flex justify-center items-center h-full">
            <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleInventory(row)}
                aria-label={`Select ${row.product?.name}`}
            />
        </div>
        );
      },
    },
    { key: 'product.sku', header: 'SKU', sortable: true },
    { key: 'product.name', header: 'Product', sortable: true },
    { key: 'location.name', header: 'Location', sortable: true },
    { key: 'storedQuantity', header: 'On Hand', sortable: true },
  ];

  const selectedCount = selectedInventories.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl min-w-full flex-col overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="text-xl font-semibold">Select Items From Inventory</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden px-8 py-4 gap-4">
          {/* Filters */}
          <div className="flex w-full flex-wrap items-center gap-2">
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

          {/* Selection status bar — only shows when something is selected */}
          <div
            className={cn(
              'flex items-center justify-between rounded-lg border px-4 py-2.5 transition-all duration-200',
              selectedCount > 0
                ? 'border-primary/30 bg-primary/5 opacity-100'
                : 'border-transparent bg-transparent opacity-0 pointer-events-none h-0 py-0 overflow-hidden',
            )}
          >
            <div className="flex items-center gap-2.5">
                <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all on this page"
                />
              <PackageCheck className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-1.5 max-w-md">
                {selectedInventories.slice(0, 3).map((inv) => (
                  <Badge
                    key={inv.id}
                    variant="secondary"
                    className="text-xs gap-1 pr-1"
                  >
                    {inv.product?.name ?? inv.product?.sku ?? `Item ${inv.id}`}
                    <button
                      onClick={() => toggleInventory(inv)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      aria-label={`Remove ${inv.product?.name}`}
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
                {selectedInventories.length > 3 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    +{selectedInventories.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 hover:text-destructive"
              onClick={clearAll}
            >
              Clear all
            </Button>
          </div>

          {/* Table */}
          <ScrollArea className="flex-1 min-h-0 rounded-md border">
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

          {/* Pagination */}
          <AppPagination
            currentPage={page}
            perPage={limit}
            totalItems={meta?.totalCount ?? 0}
            onPageChange={setPage}
            onPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-4 border-t flex items-center justify-between sm:justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0
              ? `${selectedCount} item${selectedCount !== 1 ? 's' : ''} ready to add`
              : 'No items selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Back
            </Button>
            <Button onClick={handleAddItems} disabled={selectedCount === 0}>
              Add {selectedCount > 0 ? `${selectedCount} Item${selectedCount !== 1 ? 's' : ''}` : 'Items'} to Order
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};