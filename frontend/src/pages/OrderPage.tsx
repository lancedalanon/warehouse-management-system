import { type FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getOrdersThunk } from '@/features/orders/stores/order.slice';
import type { Order } from '@/features/orders/types/order.types';
import { debounce } from 'lodash';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { AuthorizeRoles } from '@/components/AuthorizeRoles';
import { Role } from '@/enums/Role';
import { OrderFormDialog } from '@/features/orders/components/OrderFormDialog';

const OrderPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.orders);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<Order> | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderFormAction, setOrderFormAction] = useState<'create' | 'edit'>('create');

  const debouncedFetch = useMemo(
    () =>
      debounce((page: number, limit: number, search: string, sort: SortState<Order> | null) => {
        dispatch(
          getOrdersThunk({
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

  const handleSortChange = (newSort: SortState<Order>) => {
    setSort(newSort);
  };

  const columns: TableColumn<Order>[] = [
    { key: 'code', header: 'Order Code', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'capitalize',
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (rowData: { createdAt: string | Date }) => {
        if (!rowData.createdAt) return '-';
        return DayJsHelper.formatDateTime(rowData.createdAt);
      },
    },
    {
      key: 'updatedAt',
      header: 'Updated Date',
      sortable: true,
      render: (rowData: { updatedAt: string | Date }) => {
        if (!rowData.updatedAt) return '-';
        return DayJsHelper.formatDateTime(rowData.updatedAt);
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
                setSelectedOrder(row);
                setOpenOrderDialog(true);
                setOrderFormAction('edit');
              }}
            >
              <Edit className="h-4 w-4 text-blue-500" />
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
        <h1 className="text-3xl font-bold">Orders</h1>

        <AuthorizeRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER]}>
          <Button
            size="lg"
            className="text-md flex items-center gap-2 sm:ml-auto"
            onClick={() => {
              setSelectedOrder(null);
              setOpenOrderDialog(true);
              setOrderFormAction('create');
            }}
          >
            <Plus className="!size-5" />
            Create Order
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
                placeholder="Search orders..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-92 min-w-full rounded-md border">
            <DataTable<Order>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No orders found',
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

      <OrderFormDialog
        open={openOrderDialog}
        setOpen={setOpenOrderDialog}
        actionType={orderFormAction}
        initialData={orderFormAction === 'edit' ? selectedOrder! : undefined}
        onSuccess={() => {
          dispatch(
            getOrdersThunk({
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

export default OrderPage;
