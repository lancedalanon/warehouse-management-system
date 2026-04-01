'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AppPaginationProps = {
  totalItems: number;
  perPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
};

export function AppPagination({
  totalItems,
  perPage,
  currentPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 25, 50, 100],
}: AppPaginationProps) {
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Counter */}
        <span className="text-muted-foreground text-center text-sm md:text-left">
          Showing {startIndex}-{endIndex} of {totalItems}
        </span>

        {/* Pagination buttons (only show if more than 1 page) */}
        {totalPages > 1 && (
          <div className="flex justify-center md:flex-1">
            <Pagination>
              <PaginationContent className="flex flex-wrap justify-center gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === 1}
                    onClick={() => onPageChange(1)}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>

                {currentPage > 3 && <span className="hidden px-2 sm:inline">...</span>}

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages) return null;
                  if (page >= currentPage - 1 && page <= currentPage + 1) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => onPageChange(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                {currentPage < totalPages - 2 && <span className="hidden px-2 sm:inline">...</span>}

                <PaginationItem>
                  <PaginationLink
                    isActive={currentPage === totalPages}
                    onClick={() => onPageChange(totalPages)}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Per page (shadcn Select) */}
        {onPerPageChange && (
          <div className="flex justify-center md:justify-end">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>Per page:</span>

              <Select
                value={String(perPage)}
                onValueChange={(value) => onPerPageChange(Number(value))}
              >
                <SelectTrigger className="w-22.5">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {perPageOptions.map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
