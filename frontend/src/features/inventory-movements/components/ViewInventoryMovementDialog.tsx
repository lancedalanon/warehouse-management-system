'use client';

import { type FC, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getInventoryMovementsThunk } from '@/features/inventory-movements/stores/inventory-movement.thunks';
import type { InventoryMovement } from '@/features/inventory-movements/types/inventory-movement.types';
import type { Inventory } from '@/features/inventories/types/inventory.types';
import { debounce } from 'lodash';
import { STATUS_COLORS } from '@/configs/status-colors.config';
import { StatusBadge } from '@/components/StatusBadge';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  inventory: Inventory | null;
}

export const ViewInventoryMovementDialog: FC<Props> = ({ open, setOpen, inventory }) => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.inventoryMovements);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortState<InventoryMovement> | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const inventoryId = inventory?.id ?? null;

  // Debounced fetch
  const debouncedFetch = useMemo(
    () =>
      debounce(
        (
          inventoryId: number,
          page: number,
          limit: number,
          sort: SortState<InventoryMovement> | null,
        ) => {
          dispatch(
            getInventoryMovementsThunk({
              inventoryId,
              page,
              limit,
              sortBy: sort?.columnKey != null ? String(sort.columnKey) : undefined,
              sortDirection: sort?.direction,
            }),
          );
        },
        300,
      ),
    [dispatch, sort],
  );

  useEffect(() => {
    if (inventoryId != null && open) {
      debouncedFetch(inventoryId, page, limit, sort);
    }
    return () => debouncedFetch.cancel();
  }, [inventoryId, page, limit, sort, open, debouncedFetch]);

  const handleSortChange = (newSort: SortState<InventoryMovement>) => {
    setSort(newSort);
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Movement table columns
  const columns: TableColumn<InventoryMovement>[] = [
    {
      key: 'toState',
      header: 'Activity',
      sortable: false,
      className: 'capitalize',
      render: (row) => {
        const label = `${row.fromState} → ${row.toState}`;
        const statusType = row.toState.toLowerCase();

        const colors =
          STATUS_COLORS[statusType as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;

        return (
          <StatusBadge
            label={label}
            bgColor={colors.bg}
            textColor={colors.text}
            dotColor={colors.dot}
          />
        );
      },
    },
    { key: 'quantity', header: 'Quantity', sortable: true },
    { key: 'fromLocation.name', header: 'From Location', sortable: true },
    { key: 'toLocation.name', header: 'To Location', sortable: true },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (rowData: { createdAt: string | Date }) => {
        if (!rowData.createdAt) return '-';
        return DayJsHelper.formatDateTime(rowData.createdAt);
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      isActions: true,
      renderActions: (row) => (
        <Button variant="ghost" size="icon" onClick={() => toggleRow(row.id)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (!inventory) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl min-w-full flex-col overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle>Inventory Actions</DialogTitle>
        </DialogHeader>

        {/* Inventory Summary */}
        <div className="grid grid-cols-2 gap-6 rounded-lg border p-4 text-sm">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Product</p>
            <p className="font-medium break-words">{inventory.product?.name ?? '-'}</p>
          </div>

          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">SKU</p>
            <p className="font-medium break-words">{inventory.product?.sku ?? '-'}</p>
          </div>

          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Location</p>
            <p className="font-medium break-words">{inventory.location?.name ?? '-'}</p>
          </div>

          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">Current Quantity On Hand</p>
            <p className="font-medium break-words">{inventory.storedQuantity ?? '-'}</p>
          </div>
        </div>

        <ScrollArea className="h-92 min-w-full rounded-md border">
          {/* Movement Table */}
          <DataTable<InventoryMovement>
            data={items}
            columns={columns}
            onSortChange={handleSortChange}
            isLoading={status.fetch === 'loading'}
            error={status.fetch === 'error' ? error.fetch : null}
            loadingRows={limit}
            emptyState={{
              title: 'No actions records found',
              description: 'This inventory has no recorded actions.',
            }}
            striped
            hoverable
            expandedRows={expandedRows}
            rowKey="id"
            renderExpandedRow={(row) => (
              <TableCell
                colSpan={columns.length}
                className="p-3 text-sm break-words whitespace-pre-wrap"
              >
                {row.notes || 'No notes'}
              </TableCell>
            )}
          />
          <ScrollBar
            orientation="horizontal"
            className="h-3 bg-black/20 [&_[data-radix-scroll-area-thumb]]:bg-black [&_[data-radix-scroll-area-thumb]]:hover:bg-black/80"
          />
        </ScrollArea>

        {/* Pagination */}
        {meta && (
          <div className="mt-4">
            <AppPagination
              currentPage={page}
              perPage={limit}
              totalItems={meta.totalCount}
              onPageChange={setPage}
              onPerPageChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
