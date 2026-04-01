import { type FC, useCallback } from 'react';
import AsyncComboboxSingle from '@/components/AsyncComboboxSingle';
import { getProductsThunk } from '@/features/products/stores/product.slice';
import { useAppDispatch } from '@/stores/hooks';

interface ProductAsyncComboboxSingleProps {
  selectedProductId: string | number | null;
  setSelectedProductId: (id: string | number | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

const ProductAsyncComboboxSingle: FC<ProductAsyncComboboxSingleProps> = ({
  selectedProductId,
  setSelectedProductId,
  disabled = false,
  label = '',
  placeholder = 'Select a product...',
}) => {
  const dispatch = useAppDispatch();

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
    <AsyncComboboxSingle
      selectedValue={selectedProductId}
      onSelectionChange={setSelectedProductId}
      fetchFunction={fetchProducts}
      disabled={disabled}
      label={label}
      placeholder={placeholder}
    />
  );
};

export default ProductAsyncComboboxSingle;
