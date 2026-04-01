'use client';

import { type FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getAuditLogsThunk } from '@/features/audit-logs/stores/audit-log.slice';
import type { AuditLog } from '@/features/audit-logs/types/audit-log.types';
import { debounce } from 'lodash';
import { Eye, Search } from 'lucide-react';
import { ViewAuditLogDialog } from '@/features/audit-logs/components/ViewAuditLogDialog';
import { Button } from '@/components/ui/button';
import { DayJsHelper } from '@/lib/dayjs-helper';

const AuditLogsPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.auditLogs);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<AuditLog> | null>(null);

  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Debounced fetch
  const debouncedFetch = useMemo(
    () =>
      debounce((page: number, limit: number, search: string, sort: SortState<AuditLog> | null) => {
        dispatch(
          getAuditLogsThunk({
            page,
            limit,
            search,
            sortBy: sort?.columnKey != null ? String(sort.columnKey) : undefined,
            sortDirection: sort?.direction,
          }),
        );
      }, 500),
    [dispatch],
  );

  useEffect(() => {
    debouncedFetch(page, limit, search, sort);
    return () => debouncedFetch.cancel();
  }, [page, limit, search, sort, debouncedFetch]);

  const handleSortChange = (newSort: SortState<AuditLog>) => {
    setSort(newSort);
  };

  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'event',
      header: 'Event',
      sortable: true,
      className: 'capitalize',
      render: (row) => {
        if (!row.event) return '-';
        return row.event
          .toLowerCase()
          .split('_')
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(' ');
      },
    },
    { key: 'description', header: 'Description', sortable: false },
    { key: 'auditableType', header: 'Auditable Type', sortable: true },
    { key: 'auditableId', header: 'Auditable ID', sortable: true },
    {
      key: 'user.firstName',
      header: 'User',
      sortable: true,
      render: (row) => {
        const user = row.user;
        if (!user) return '-';
        return `${user.firstName} ${user.lastName}`;
      },
    },
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
      isActions: true,
      renderActions: (row) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setSelectedAudit(row);
            setOpenDialog(true);
          }}
          title="View Audit Log Details"
        >
          <Eye className="h-4 w-4 text-gray-700" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 md:overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>

      {/* Table Section */}
      <Card className="flex flex-1 flex-col overflow-y-auto">
        <CardHeader>
          <div className="relative flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search audit logs..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-92 min-w-full rounded-md border">
            <DataTable<AuditLog>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No audit logs found',
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

      <ViewAuditLogDialog open={openDialog} setOpen={setOpenDialog} auditLog={selectedAudit} />
    </div>
  );
};

export default AuditLogsPage;
