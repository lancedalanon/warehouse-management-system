import { type FC, useCallback } from 'react';
import AsyncComboboxMultiple from '@/components/AsyncComboboxMultiple';
import { getProductsThunk } from '@/features/products/stores/product.slice';
import { useAppDispatch } from '@/stores/hooks';

interface ProductAsyncComboboxProps {
  selectedProducts: number[];
  setSelectedProducts: (ids: number[]) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  maxBadgeChars?: number;
}

const ProductAsyncCombobox: FC<ProductAsyncComboboxProps> = ({
  selectedProducts,
  setSelectedProducts,
  disabled = false,
  label = '',
  placeholder = 'Search products...',
  maxBadgeChars = 25,
}) => {
  const dispatch = useAppDispatch();

  // Create the fetch function that AsyncComboboxMultiple expects
  const fetchProducts = useCallback(
    async ({ page, limit, search }: { page: number; limit: number; search: string }) => {
      try {
        const result = await dispatch(
          getProductsThunk({
            page,
            limit,
            search,
          }),
        ).unwrap();

        return {
          items: result.data,
          meta: {
            hasNextPage: result.meta?.hasNextPage ?? false,
          },
        };
      } catch (error) {
        console.error('Failed to fetch products:', error);
        return {
          items: [],
          meta: {
            hasNextPage: false,
          },
        };
      }
    },
    [dispatch],
  );

  return (
    <AsyncComboboxMultiple
      selectedValues={selectedProducts}
      onSelectionChange={setSelectedProducts}
      fetchFunction={fetchProducts}
      label={label}
      placeholder={placeholder}
      disabled={disabled}
      maxBadgeChars={maxBadgeChars}
    />
  );
};

export default ProductAsyncCombobox;
