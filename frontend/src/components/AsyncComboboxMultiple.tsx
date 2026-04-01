'use client';

import { useId, useState, useEffect, useMemo } from 'react';
import { CheckIcon, ChevronsUpDownIcon, XIcon, Loader2Icon } from 'lucide-react';
import { debounce } from 'lodash';

import { Badge } from '@/components/ui/badge';
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

interface AsyncComboboxMultipleProps<T extends Option<Id>, Id extends string | number> {
  selectedValues: Id[];
  onSelectionChange: (values: Id[]) => void;
  fetchFunction: (params: {
    page: number;
    limit: number;
    search: string;
  }) => Promise<FetchResult<T>>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  maxBadgeChars?: number;
  itemsPerPage?: number;
  getOptionLabel?: (option: T) => string;
  getOptionValue?: (option: T) => Id;
}

const AsyncComboboxMultiple = <Id extends string | number, T extends Option<Id>>({
  selectedValues,
  onSelectionChange,
  fetchFunction,
  label = 'Select items',
  placeholder = 'Search...',
  disabled = false,
  maxBadgeChars = 20,
  itemsPerPage = 10,
  getOptionLabel = (option: T) => option.name,
  getOptionValue = (option: T) => option.id,
}: AsyncComboboxMultipleProps<T, Id>) => {
  const id = useId();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Debounced fetch
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

  const toggleSelection = (value: Id) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const removeSelection = (value: Id) => {
    onSelectionChange(selectedValues.filter((v) => v !== value));
  };

  const clearAll = () => {
    onSelectionChange([]);
    setExpanded(false);
  };

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

  // Get selected item details
  const selectedItems = items.filter((item) => selectedValues.includes(getOptionValue(item)));

  const maxShownItems = 1;
  const visibleItems = expanded ? selectedItems : selectedItems.slice(0, maxShownItems);
  const hiddenCount = selectedItems.length - visibleItems.length;

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
            <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
              {selectedItems.length > 0 ? (
                <>
                  {visibleItems.map((item) => (
                    <Badge
                      key={getOptionValue(item)}
                      variant="outline"
                      className="max-w-full rounded-sm"
                    >
                      <span className="truncate">
                        {truncateText(getOptionLabel(item), maxBadgeChars)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 size-4 shrink-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelection(getOptionValue(item));
                        }}
                        asChild
                      >
                        <span>
                          <XIcon className="size-4" />
                        </span>
                      </Button>
                    </Badge>
                  ))}
                  {hiddenCount > 0 && !expanded && (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                      }}
                      className="cursor-pointer rounded-sm"
                    >
                      +{hiddenCount} more
                    </Badge>
                  )}
                  {expanded && selectedItems.length > maxShownItems && (
                    <Badge
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(false);
                      }}
                      className="cursor-pointer rounded-sm"
                    >
                      Show Less
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground font-normal">{placeholder}</span>
              )}
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-1">
              {selectedItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
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
                  const isSelected = selectedValues.includes(value);
                  return (
                    <CommandItem
                      key={value}
                      value={value.toString()}
                      onSelect={() => toggleSelection(value)}
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

export default AsyncComboboxMultiple;
