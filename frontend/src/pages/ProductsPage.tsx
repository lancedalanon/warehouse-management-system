import { type FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getProductsThunk, deleteProductThunk } from '@/features/products/stores/product.slice';
import type { Product } from '@/features/products/types/product.types';
import { debounce } from 'lodash';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ProductFormDialog } from '@/features/products/components/ProductFormDialog';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { TableCell } from '@/components/ui/table';
import { AuthorizeRoles } from '@/components/AuthorizeRoles';
import { Role } from '@/enums/Role';
import { toast } from 'sonner';

const ProductsPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.products);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<Product> | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [openProductFormDialog, setOpenProductFormDialog] = useState(false);
  const [productFormAction, setProductFormAction] = useState<'create' | 'edit' | 'add-received'>(
    'create',
  );
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const debouncedFetch = useMemo(
    () =>
      debounce((page: number, limit: number, search: string, sort: SortState<Product> | null) => {
        dispatch(
          getProductsThunk({
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

  const handleSortChange = (newSort: SortState<Product>) => {
    setSort(newSort);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setLoadingDelete(true);
    try {
      await dispatch(deleteProductThunk(selectedProduct.id)).unwrap();
      toast.success('Product deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } finally {
      setLoadingDelete(false);
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const columns: TableColumn<Product>[] = [
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'unitType', header: 'Unit Type', sortable: true },
    { key: 'receivedQuantity', header: 'Received Quantity', sortable: true },
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
          {/* View More is always visible */}
          <Button variant="ghost" size="icon" onClick={() => toggleRow(row.id)} title="View More">
            <MoreHorizontal className="h-4 w-4 text-black" />
          </Button>

          {/* Only visible for specific roles */}
          <AuthorizeRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER, Role.INVENTORY_STAFF]}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedProduct(row);
                setProductFormAction('add-received');
                setOpenProductFormDialog(true);
              }}
              title="Add Received Quantity"
            >
              <Plus className="h-4 w-4 text-green-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedProduct(row);
                setProductFormAction('edit');
                setOpenProductFormDialog(true);
              }}
              title="Edit Product"
            >
              <Edit className="h-4 w-4 text-blue-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedProduct(row);
                setDeleteDialogOpen(true);
              }}
              title="Delete Product"
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
        <h1 className="text-3xl font-bold">Products</h1>
        <AuthorizeRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER, Role.INVENTORY_STAFF]}>
          <Button
            size="lg"
            className="text-md flex items-center gap-2 sm:ml-auto"
            onClick={() => {
              setProductFormAction('create');
              setOpenProductFormDialog(true);
            }}
          >
            <Plus className="!size-5" />
            Create Product
          </Button>
        </AuthorizeRoles>
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
                placeholder="Search products..."
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
            <DataTable<Product>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No products found',
                description: 'Try adjusting your search or filters.',
              }}
              onRetry={() => debouncedFetch(page, limit, search, sort)}
              striped
              hoverable
              expandedRows={expandedRows}
              rowKey="id"
              renderExpandedRow={(row) => (
                <TableCell
                  colSpan={columns.length}
                  className="p-3 text-sm break-words whitespace-pre-wrap"
                >
                  {row.description || 'No description available.'}
                </TableCell>
              )}
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
        name={selectedProduct?.name}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        loading={loadingDelete}
      />

      <ProductFormDialog
        open={openProductFormDialog}
        setOpen={setOpenProductFormDialog}
        actionType={productFormAction}
        initialData={selectedProduct ?? undefined}
        onSuccess={() => {
          dispatch(
            getProductsThunk({
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

export default ProductsPage;
