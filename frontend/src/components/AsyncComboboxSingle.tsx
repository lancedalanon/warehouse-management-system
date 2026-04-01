'use client';

import { useId, useState, useEffect, useMemo } from 'react';
import { CheckIcon, ChevronsUpDownIcon, XIcon, Loader2Icon } from 'lucide-react';
import { debounce } from 'lodash';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Option<Id extends string | number> {
  id: Id;
  name: string;
  [key: string]: unknown;
}

interface FetchResult<T> {
  items: T[];
  meta?: {
    hasNextPage?: boolean;
    totalPages?: number;
    currentPage?: number;
  };
}

interface AsyncComboboxSingleProps<T extends Option<Id>, Id extends string | number> {
  selectedValue: Id | null;
  onSelectionChange: (value: Id | null) => void;
  fetchFunction: (params: {
    page: number;
    limit: number;
    search: string;
  }) => Promise<FetchResult<T>>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  itemsPerPage?: number;
  getOptionLabel?: (option: T) => string;
  getOptionValue?: (option: T) => Id;
}

const AsyncComboboxSingle = <Id extends string | number, T extends Option<Id>>({
  selectedValue,
  onSelectionChange,
  fetchFunction,
  label,
  placeholder = 'Select item...',
  disabled = false,
  itemsPerPage = 10,
  getOptionLabel = (option: T) => option.name,
  getOptionValue = (option: T) => option.id,
}: AsyncComboboxSingleProps<T, Id>) => {
  const id = useId();

  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedFetch = useMemo(
    () =>
      debounce(async (page: number, limit: number, search: string) => {
        setIsLoading(true);
        try {
          const result = await fetchFunction({ page, limit, search });

          if (page === 1) {
            setItems(result.items);
          } else {
            setItems((prev) => [...prev, ...result.items]);
          }

          setHasNextPage(result.meta?.hasNextPage ?? false);
        } catch (error) {
          console.error('Failed to fetch items:', error);
        } finally {
          setIsLoading(false);
        }
      }, 500),
    [fetchFunction],
  );

  useEffect(() => {
    debouncedFetch(page, itemsPerPage, search);
    return () => {
      debouncedFetch.cancel();
    };
  }, [page, itemsPerPage, search, debouncedFetch]);

  const handleSearchChange = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;

    if (bottom && !isLoading && hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  const selectedItem = items.find((item) => getOptionValue(item) === selectedValue);

  return (
    <div className="w-full space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="relative h-auto min-h-8 w-full min-w-0 justify-between hover:bg-transparent"
          >
            <span className="w-0 flex-1 truncate text-left">
              {selectedItem ? (
                getOptionLabel(selectedItem)
              ) : (
                <span className="text-muted-foreground font-normal">{placeholder}</span>
              )}
            </span>

            <div className="ml-2 flex shrink-0 items-center gap-1">
              {selectedValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectionChange(null);
                  }}
                  asChild
                >
                  <span>
                    <XIcon className="size-4" />
                  </span>
                </Button>
              )}
              <ChevronsUpDownIcon
                className="text-muted-foreground/80 size-4 shrink-0"
                aria-hidden="true"
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popper-anchor-width)" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={handleSearchChange}
            />
            <CommandList onScroll={handleScroll}>
              <CommandEmpty>{isLoading ? 'Loading...' : 'No items found.'}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const value = getOptionValue(item);
                  const isSelected = selectedValue === value;
                  return (
                    <CommandItem
                      key={value}
                      value={value.toString()}
                      onSelect={() => {
                        onSelectionChange(isSelected ? null : value);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">{getOptionLabel(item)}</span>
                      {isSelected && <CheckIcon size={16} className="ml-auto shrink-0" />}
                    </CommandItem>
                  );
                })}
                {isLoading && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2Icon className="size-4 animate-spin" />
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AsyncComboboxSingle;
