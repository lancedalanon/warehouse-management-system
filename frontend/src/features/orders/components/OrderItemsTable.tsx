'use client';

import { useState, type FC } from 'react';
import { DataTable } from '@/components/DataTable';
import { Trash2, Plus, Search } from 'lucide-react';
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFieldArrayUpdate,
} from 'react-hook-form';
import type { TableColumn } from '@/types/components/data-table.types';
import type { Inventory } from '@/features/inventories/types/inventory.types';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { InventorySelectionDialog } from './InventorySelectionDialog';
import type {
  CreateOrderFormValues,
  createOrderSchema,
} from '../schemas/create-order-schema';
import type z from 'zod';
import type { UpdateOrderFormValues } from '../schemas/update-order-schema';

interface OrderItemsTableProps {
  items: FieldArrayWithId<CreateOrderFormValues, 'items'>[];
  removeItem: UseFieldArrayRemove;
  updateItem: UseFieldArrayUpdate<CreateOrderFormValues, 'items'>;
  appendItem: (item: CreateOrderFormValues['items'][number]) => void;
  inventoryLookup: Record<number, Inventory>;
  setInventoryLookup: React.Dispatch<
    React.SetStateAction<Record<number, Inventory>>
  >;
  errors: FieldErrors<CreateOrderFormValues | UpdateOrderFormValues>;
}

export const OrderItemsTable: FC<OrderItemsTableProps> = ({
  items,
  removeItem,
  updateItem,
  appendItem,
  inventoryLookup,
  setInventoryLookup,
  errors
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState('');

  const columns: TableColumn<
    FieldArrayWithId<z.output<typeof createOrderSchema>, 'items'>
  >[] = [
    {
      key: 'productName',
      header: 'Product Name',
      render: (row) =>
        inventoryLookup[row.inventorySourceId]?.product?.name ?? '-',
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (row) =>
        inventoryLookup[row.inventorySourceId]?.product?.sku ?? '-',
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) =>
        inventoryLookup[row.inventorySourceId]?.location?.name ?? '-',
    },
    {
      key: 'storedQuantity',
      header: 'On Hand',
      render: (row) =>
        inventoryLookup[row.inventorySourceId]?.storedQuantity ?? 0,
    },
    {
      key: 'quantity',
      header: 'Ordered Qty',
      render: (row) => {
        const realIndex = items.findIndex((i) => i.id === row.id);
        const quantityError =
          errors?.items?.[realIndex]?.quantity?.message;

        return (
          <div className="flex flex-col">
            <Input
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) =>
                updateItem(realIndex, {
                  inventorySourceId: row.inventorySourceId,
                  quantity: Number(e.target.value),
                })
              }
              className="w-20"
            />
            {quantityError && (
              <p className="text-red-500 text-xs mt-1">
                {quantityError as string}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      isActions: true,
      renderActions: (row) => {
        const realIndex = items.findIndex((i) => i.id === row.id);

        return (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => removeItem(realIndex)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        );
      },
    },
  ];

  const handleAddingItems = (selected: Inventory[]) => {
    const existingIds = new Set(
      items.map((i) => Number(i.inventorySourceId))
    );

    const newItems = selected.filter(
      (inv) => !existingIds.has(Number(inv.id))
    );

    newItems.forEach((inv) => {
      appendItem({
        inventorySourceId: Number(inv.id),
        quantity: 1,
      });
    });

    setInventoryLookup((prev) => {
      const updated = { ...prev };
      newItems.forEach((inv) => {
        updated[Number(inv.id)] = inv;
      });
      return updated;
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="relative w-96">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Button
          size="lg"
          className="text-md flex items-center gap-2"
          type="button"
          onClick={() => setOpenDialog(true)}
        >
          <Plus className="!size-5" />
          Add Items
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="h-96 rounded-md border">
        <DataTable
          data={items}
          columns={columns}
          isLoading={false}
          striped
          hoverable
          emptyState={{
            title: 'No items added',
            description: 'Click "Add Items" to select inventory.',
          }}
        />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <InventorySelectionDialog
        open={openDialog}
        setOpen={setOpenDialog}
        onAddItems={handleAddingItems}
      />
    </>
  );
};