'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';
import type { TableColumn, SortState } from '@/types/components/data-table.types';
import _ from 'lodash';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  onSortChange?: (sort: SortState<T>) => void;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  emptyState?: {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
  };
  loadingRows?: number;
  stickyHeader?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  className?: string;
  expandedRows?: Record<string | number, boolean>;
  renderExpandedRow?: (row: T) => React.ReactNode;
  rowKey?: keyof T;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onSortChange,
  isLoading = false,
  error = null,
  onRetry,
  emptyState,
  loadingRows = 5,
  stickyHeader = false,
  hoverable = true,
  striped = false,
  className = '',
  expandedRows,
  rowKey,
  renderExpandedRow,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState<T>>({});

  const debouncedSortChange = React.useMemo(
    () =>
      _.debounce((nextSort: SortState<T>) => {
        onSortChange?.(nextSort);
      }, 100),
    [onSortChange],
  );

  const handleSort = (columnKey: keyof T) => {
    setSort((prev) => {
      let next: SortState<T>;

      if (prev.columnKey !== columnKey) {
        next = { columnKey, direction: 'ASC' };
      } else if (prev.direction === 'ASC') {
        next = { columnKey, direction: 'DESC' };
      } else {
        next = {};
      }

      debouncedSortChange(next);
      return next;
    });
  };

  const getNestedValue = (obj: unknown, path: string): unknown => {
    if (obj === null || typeof obj !== 'object') return undefined;
    if (!path) return undefined;

    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc === null || typeof acc !== 'object') return undefined;

      if (acc instanceof Object && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }

      return undefined;
    }, obj);
  };

  const renderSortIcon = (columnKey: keyof T) => {
    if (sort.columnKey !== columnKey || !sort.direction) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }

    return sort.direction === 'ASC' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const renderLoadingSkeleton = () => (
    <>
      {Array.from({ length: loadingRows }).map((_, index) => (
        <TableRow key={`loading-${index}`}>
          {columns.map((col) => (
            <TableCell key={String(col.key)} className={col.className}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  const renderError = () => {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';

    return (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-82">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="text-destructive/70 h-12 w-12" />

            <h3 className="mt-4 text-lg font-semibold">Something went wrong</h3>

            <p className="text-muted-foreground mt-2 max-w-sm text-sm">{errorMessage}</p>

            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderEmpty = () => {
    const defaultEmptyState = {
      title: 'No results found',
      description: 'There are no records to display at this time.',
      icon: <Search className="text-muted-foreground/50 h-12 w-12" />,
    };

    const state = { ...defaultEmptyState, ...emptyState };

    return (
      <TableRow>
        <TableCell colSpan={columns.length} className="h-82">
          <div className="flex flex-col items-center justify-center text-center">
            {state.icon}
            <h3 className="mt-4 text-lg font-semibold">{state.title}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">{state.description}</p>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const getRowKey = (row: T, index: number) => {
    if (rowKey && row[rowKey] !== undefined) return row[rowKey] as string | number;
    return index;
  };

  return (
    <div className={`w-full ${className}`}>
      <Table className="min-w-full">
        <TableHeader className={stickyHeader ? 'sticky top-0 z-20' : ''}>
          <TableRow className="hover:bg-transparent">
            {columns.map((col, colIndex) => {
              const isFirst = colIndex === 0;
              const isLast = colIndex === columns.length - 1;

              return (
                <TableHead
                  key={String(col.key)}
                  className={`sticky top-0 z-20 bg-black whitespace-nowrap text-white ${col.className ?? ''} ${isFirst ? 'rounded-tl-lg' : ''} ${isLast ? 'rounded-tr-lg text-center' : ''} `}
                >
                  {col.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`-ml-2 h-8 px-2 font-semibold text-white hover:bg-white/10 hover:text-white`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.header}
                      {renderSortIcon(col.key)}
                    </Button>
                  ) : (
                    <span
                      className={`px-2 font-semibold ${isLast ? 'text-center' : ''} text-white`}
                    >
                      {col.header}
                    </span>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody className="bg-card">
          {isLoading
            ? renderLoadingSkeleton()
            : error
              ? renderError()
              : data.length === 0
                ? renderEmpty()
                : data.map((row, rowIndex) => {
                    const key = getRowKey(row, rowIndex);
                    const isExpanded = expandedRows?.[key] ?? false;

                    return (
                      <React.Fragment key={key}>
                        <TableRow
                          className={` ${hoverable ? 'hover:bg-muted/50 transition-colors' : ''} ${
                            striped && rowIndex % 2 === 1 ? 'bg-muted/20' : ''
                          } `}
                        >
                          {columns.map((col, colIndex) => {
                            if (col.isActions) {
                              return (
                                <TableCell
                                  key={String(col.key)}
                                  className={`${col.className ?? ''} text-center`}
                                >
                                  {col.renderActions ? col.renderActions(row) : null}
                                </TableCell>
                              );
                            }
                            const rawValue =
                              typeof col.key === 'string'
                                ? getNestedValue(row, col.key)
                                : row[col.key];
                            const cellValue = col.render
                              ? col.render(row)
                              : String(rawValue ?? '-');
                            const isLast = colIndex === columns.length - 1;
                            return (
                              <TableCell
                                key={String(col.key)}
                                className={`${col.className ?? ''} max-w-xs truncate ${isLast ? 'text-center' : ''}`}
                              >
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-block max-w-full truncate">
                                        {cellValue ?? '-'}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent align="start" side="top" className="max-w-xs">
                                      <pre className="whitespace-pre-wrap">
                                        {String(rawValue ?? '-')}
                                      </pre>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            );
                          })}
                        </TableRow>

                        {/* Expanded Row */}
                        {isExpanded && renderExpandedRow && (
                          <TableRow>
                            <TableCell colSpan={columns.length}>{renderExpandedRow(row)}</TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
        </TableBody>
      </Table>
    </div>
  );
}
