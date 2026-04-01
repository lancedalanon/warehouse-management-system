'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { AuditLog } from '@/features/audit-logs/types/audit-log.types';
import { format } from 'date-fns';

interface ViewAuditLogDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  auditLog?: AuditLog | null;
}

export const ViewAuditLogDialog: React.FC<ViewAuditLogDialogProps> = ({
  open,
  setOpen,
  auditLog,
}) => {
  const formatEvent = (event: string) =>
    event
      .split('_')
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(' ');

  const formatDate = (value: string | Date) =>
    format(typeof value === 'string' ? new Date(value) : value, 'PPP p');

  const excludedFields = useMemo(() => ['id', 'createdAt', 'updatedAt', 'deletedAt'], []);

  // Recursively flatten object and return rows
  const getRows = (
    oldValues: Record<string, unknown> = {},
    newValues: Record<string, unknown> = {},
    parentKey = '',
  ): { field: string; oldVal: unknown; newVal: unknown; isChanged: boolean }[] => {
    const keys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)])).filter(
      (k) => !excludedFields.includes(k),
    );

    const rows: { field: string; oldVal: unknown; newVal: unknown; isChanged: boolean }[] = [];

    keys.forEach((key) => {
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      const fieldName = parentKey ? `${parentKey}.${key}` : key;

      if (oldVal && typeof oldVal === 'object' && !Array.isArray(oldVal)) {
        // Recursive flattening for nested object
        rows.push(
          ...getRows(
            oldVal as Record<string, unknown>,
            (newVal as Record<string, unknown>) ?? {},
            fieldName,
          ),
        );
      } else {
        rows.push({
          field: fieldName,
          oldVal: oldVal ?? '-',
          newVal: newVal ?? '-',
          isChanged: oldVal !== newVal,
        });
      }
    });

    return rows;
  };

  const rows = useMemo(() => {
    if (!auditLog) return [];
    return getRows(auditLog.oldValues ?? {}, auditLog.newValues ?? {});
  }, [auditLog]);

  const renderValue = (val: unknown) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

  if (!auditLog) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl min-w-full flex-col gap-6 overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-6 rounded-lg border p-4 text-sm">
          <div>
            <p className="text-muted-foreground">Event</p>
            <p className="font-medium">{formatEvent(auditLog.event)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">User</p>
            <p className="font-medium">
              {auditLog.user ? `${auditLog.user.firstName} ${auditLog.user.lastName}` : '-'}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{formatDate(auditLog.createdAt)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Auditable</p>
            <p className="font-medium">
              {auditLog.auditableType} (ID: {auditLog.auditableId})
            </p>
          </div>
        </div>

        {/* Changes Table */}
        <ScrollArea className="h-92 min-w-full rounded-md border">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-black hover:bg-black">
                <TableHead className="rounded-tl-lg text-white">Field</TableHead>
                <TableHead className="text-white">Old Value</TableHead>
                <TableHead className="rounded-tr-lg text-center text-white">New Value</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground py-12 text-center">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ field, oldVal, newVal, isChanged }, index) => (
                  <TableRow
                    key={field}
                    className={[
                      index % 2 === 1 ? 'bg-muted/20' : '',
                      isChanged ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'opacity-60',
                    ].join(' ')}
                  >
                    <TableCell className="font-medium capitalize">
                      {field}
                      {!isChanged && (
                        <span className="text-muted-foreground ml-2 text-xs">(unchanged)</span>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {renderValue(oldVal)}
                    </TableCell>

                    <TableCell className="max-w-xs truncate text-center font-medium">
                      {renderValue(newVal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <ScrollBar
            orientation="horizontal"
            className="h-3 bg-black/20 [&_[data-radix-scroll-area-thumb]]:bg-black"
          />
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
