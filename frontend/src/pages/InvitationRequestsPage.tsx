import { type FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/DataTable';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AppPagination } from '@/components/AppPagination';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { getInvitationRequestsThunk } from '@/features/invitation-requests/stores/invitation-request.slice';
import type {
  InvitationRequest,
  InvitationRequestStatus,
} from '@/features/invitation-requests/types/invitation-request.types';
import { debounce } from 'lodash';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Search, X } from 'lucide-react';
import { declineInvitationRequestThunk } from '@/features/invitation-requests/stores/invitation-request.thunks';
import { Button } from '@/components/ui/button';
import { ConfirmDeclineDialog } from '@/features/invitation-requests/components/ConfirmDeclineDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { PENDING_DECLINED_COLORS } from '@/configs/status-colors.config';
import { AcceptRequestAndCreateUserDialog } from '@/features/invitation-requests/components/AcceptRequestAndCreateUserDialog';
import { DayJsHelper } from '@/lib/dayjs-helper';
import { toast } from 'sonner';

const InvitationRequestsPage: FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, status, error } = useAppSelector((state) => state.invitationRequests);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationRequestStatus | ''>('');
  const [sort, setSort] = useState<SortState<InvitationRequest> | null>(null);

  const [selectedInvitation, setSelectedInvitation] = useState<InvitationRequest | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedInvitee, setSelectedInvitee] = useState<InvitationRequest | null>(null);

  const debouncedFetch = useMemo(
    () =>
      debounce(
        (
          page: number,
          limit: number,
          search: string,
          status: InvitationRequestStatus | '',
          sort: SortState<InvitationRequest> | null,
        ) => {
          dispatch(
            getInvitationRequestsThunk({
              page,
              limit,
              search,
              status: status || undefined,
              sortBy: sort?.columnKey,
              sortDirection: sort?.direction,
            }),
          );
        },
        500,
      ),
    [dispatch],
  );

  useEffect(() => {
    debouncedFetch(page, limit, search, statusFilter, sort);
    return () => debouncedFetch.cancel();
  }, [page, limit, search, statusFilter, sort, debouncedFetch]);

  const handleSortChange = (newSort: SortState<InvitationRequest>) => {
    setSort(newSort);
  };

  const handleDeclineInvitationRequest = async () => {
    if (!selectedInvitation) return;
    setLoadingDecline(true);
    try {
      await dispatch(declineInvitationRequestThunk(selectedInvitation.id)).unwrap();
      setDeclineDialogOpen(false);
      setSelectedInvitation(null);
      toast.success('Request declined successfully!');
    } finally {
      setLoadingDecline(false);
    }
  };

  const columns: TableColumn<InvitationRequest>[] = [
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      className: 'capitalize',
      render: (row) => {
        const statusType = row.declinedAt === null ? 'pending' : 'declined';
        const colors =
          PENDING_DECLINED_COLORS[statusType as keyof typeof PENDING_DECLINED_COLORS] ||
          PENDING_DECLINED_COLORS.default;

        return (
          <StatusBadge
            label={statusType.charAt(0).toUpperCase() + statusType.slice(1)}
            bgColor={colors.bg}
            textColor={colors.text}
            dotColor={colors.dot}
          />
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Requested Date',
      sortable: true,
      render: (rowData: { createdAt: string | Date }) => {
        if (!rowData.createdAt) return '-';
        return DayJsHelper.formatDateTime(rowData.createdAt);
      },
    },
    {
      key: 'updatedAt',
      header: 'Last Updated Date',
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
      renderActions: (row) => {
        const canAct = !row.declinedAt && !row.joinedAt;

        return (
          <div className="flex justify-center gap-2">
            {canAct ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSelectedInvitee(row);
                    setUserDialogOpen(true);
                  }}
                  title="Accept & Create"
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSelectedInvitation(row);
                    setDeclineDialogOpen(true);
                  }}
                  title="Decline"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </>
            ) : (
              <span>-</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 md:overflow-hidden">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">Invitation Requests</h1>
      </div>

      <Card className="flex flex-1 flex-col overflow-y-auto">
        <CardHeader>
          <div className="relative flex w-full flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search invitation request..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-64">
              <Select
                onValueChange={(value) => setStatusFilter(value as InvitationRequestStatus)}
                value={statusFilter || ''}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-92 min-w-full rounded-md border">
            <DataTable<InvitationRequest>
              data={items}
              columns={columns}
              onSortChange={handleSortChange}
              isLoading={status.fetch === 'loading'}
              error={status.fetch === 'error' ? error.fetch : null}
              loadingRows={limit}
              emptyState={{
                title: 'No invitation requests found',
                description: 'Try adjusting your search or filters.',
              }}
              onRetry={() => debouncedFetch(page, limit, search, statusFilter, sort)}
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

      <ConfirmDeclineDialog
        name={selectedInvitation?.email}
        open={declineDialogOpen}
        setOpen={setDeclineDialogOpen}
        loading={loadingDecline}
        onConfirm={handleDeclineInvitationRequest}
      />

      <AcceptRequestAndCreateUserDialog
        open={userDialogOpen}
        setOpen={setUserDialogOpen}
        selectedInvitee={selectedInvitee}
        onSuccess={() => {
          setUserDialogOpen(false);
          setSelectedInvitee(null);
          debouncedFetch(page, limit, search, statusFilter, sort);
        }}
      />
    </div>
  );
};

export default InvitationRequestsPage;
