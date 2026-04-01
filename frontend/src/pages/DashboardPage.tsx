import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { StatusCard } from '@/features/dashboard/components/StatusCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { InventoryMovement } from '@/features/inventory-movements/types/inventory-movement.types';
import { DataTable } from '@/components/DataTable';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import type { SortState, TableColumn } from '@/types/components/data-table.types';
import { debounce } from 'lodash';
import { getInventoryMovementsThunk } from '@/features/inventory-movements/stores/inventory-movement.thunks';
import { formatCompactNumber } from '@/utils/format-compact-number';
import { StatusTrendChart } from '@/features/dashboard/components/StatusTrendChart';
import {
  exportDashboardThunk,
  getDashboardThunk,
} from '@/features/dashboard/stores/dashboard.thunks';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { StatusBadge } from '@/components/StatusBadge';
import { STATUS_COLORS } from '@/configs/status-colors.config';
import { Role } from '@/enums/Role';
import { AuthorizeRoles } from '@/components/AuthorizeRoles';

const DashboardPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.inventoryMovements);
  const {
    data: dashboardData,
    status: dashboardStatus,
    error: dashboardError,
    exportStatus,
  } = useAppSelector((state) => state.dashboard);
  const [sort, setSort] = useState<SortState<InventoryMovement> | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  // Debounced fetch
  const debouncedFetch = useMemo(
    () =>
      debounce((page: number, limit: number, sort: SortState<InventoryMovement> | null) => {
        dispatch(
          getInventoryMovementsThunk({
            page,
            limit,
            sortBy: sort?.columnKey != null ? String(sort.columnKey) : undefined,
            sortDirection: sort?.direction,
          }),
        );
      }, 300),
    [dispatch],
  );

  useEffect(() => {
    debouncedFetch(1, 50, sort);
    return () => debouncedFetch.cancel();
  }, [sort, debouncedFetch]);

  const handleSortChange = (newSort: SortState<InventoryMovement>) => {
    setSort(newSort);
  };

  // Movement table columns
  const columns: TableColumn<InventoryMovement>[] = [
    {
      key: 'inventory.product.name',
      header: 'Product Name',
      className: 'capitalize',
      render: (row) => row.inventory?.product?.name ?? row.product?.name ?? '-',
    },
    {
      key: 'inventory.product.sku',
      header: 'SKU',
      className: 'capitalize',
      render: (row) => row.inventory?.product?.sku ?? row.product?.sku ?? '-',
    },
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
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      render: (value) => formatCompactNumber(value.quantity),
    },
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
  ];

  // Debounced dashboard fetch
  const debouncedDashboardFetch = useMemo(
    () =>
      debounce((range: 'today' | 'weekly' | 'monthly' | 'yearly') => {
        dispatch(getDashboardThunk({ dateRange: range }));
      }, 300),
    [dispatch],
  );

  // Fetch on mount and whenever dateRange changes
  useEffect(() => {
    debouncedDashboardFetch(dateRange);
    return () => debouncedDashboardFetch.cancel();
  }, [dateRange, debouncedDashboardFetch]);

  // Handle tab change
  const handleDateRangeChange = (value: string) => {
    if (value === 'today' || value === 'weekly' || value === 'monthly' || value === 'yearly') {
      setDateRange(value);
    }
  };

  const handleExport = useCallback(async () => {
    const result = await dispatch(exportDashboardThunk({ dateRange })).unwrap();
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  }, [dispatch, dateRange]);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Time Filters */}
          <Tabs
            value={dateRange}
            onValueChange={handleDateRangeChange}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Export Button */}
          <AuthorizeRoles roles={[Role.SUPERADMIN, Role.WAREHOUSE_MANAGER, Role.AUDITOR]}>
            <Button
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={handleExport}
              disabled={exportStatus === 'loading'}
            >
              <Download className="h-4 w-4" />
              {exportStatus === 'loading' ? 'Exporting...' : 'Export to PDF'}
            </Button>
          </AuthorizeRoles>
        </div>
      </div>

      {/* Status Cards */}
      <div className="flex flex-wrap gap-4">
        {dashboardStatus === 'error' ? (
          <div className="flex w-full justify-center font-medium text-red-500">
            {dashboardError ?? 'Failed to load inventory statuses.'}
          </div>
        ) : (
          <>
            {dashboardData?.inventoryStatuses.map((status) => (
              <StatusCard
                key={status.type}
                type={status.type}
                count={status.count}
                isLoading={dashboardStatus === 'loading'}
              />
            ))}
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Recent Movements Table */}
        <Card className="min-w-0 flex-1">
          <CardHeader>
            <CardTitle>Recent Inventory Actions</CardTitle>
            <CardDescription>
              Track recent additions, removals, and updates in your inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ScrollArea className="h-62 min-w-full rounded-md border">
              <DataTable<InventoryMovement>
                data={items}
                columns={columns}
                onSortChange={handleSortChange}
                isLoading={status.fetch === 'loading'}
                error={status.fetch === 'error' ? error.fetch : null}
                loadingRows={10}
                emptyState={{
                  title: 'No actions records found',
                  description: 'This inventory has no recorded actions.',
                }}
                striped
                hoverable
              />
              <ScrollBar
                orientation="horizontal"
                className="h-3 bg-black/20 [&_[data-radix-scroll-area-thumb]]:bg-black [&_[data-radix-scroll-area-thumb]]:hover:bg-black/80"
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Status Trend Chart wrapped in a Card */}
        <Card className="flex w-full min-w-0 flex-col lg:w-1/3">
          <CardHeader>
            <CardTitle>Status Trends</CardTitle>
            <CardDescription>Frequency of statuses over time</CardDescription>
          </CardHeader>
          {/* Status Trend Chart */}
          <CardContent className="flex flex-1 items-center justify-center">
            {dashboardStatus === 'error' ? (
              <p className="w-full text-center text-red-500">
                {dashboardError ?? 'Failed to load status trends.'}
              </p>
            ) : (
              <StatusTrendChart
                trendData={dashboardData?.recentMovements ?? []}
                isLoading={dashboardStatus === 'loading'}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
