'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateProductForm } from './CreateProductForm';
import { UpdateProductForm } from './UpdateProductForm';
import { AddReceivedForm } from './AddReceivedForm';
import type { Product } from '@/features/products/types/product.types';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  actionType: 'create' | 'edit' | 'add-received';
  initialData?: Product;
  onSuccess?: () => void;
}

export const ProductFormDialog: React.FC<Props> = ({
  open,
  setOpen,
  actionType,
  initialData,
  onSuccess,
}) => {
  const resetDialog = () => setOpen(false);

  const getTitle = () => {
    switch (actionType) {
      case 'create':
        return 'Create Product';
      case 'edit':
        return `Update Product ${initialData?.name ?? 'Product'} - ${initialData?.sku ?? ''}`;
      case 'add-received':
        return `Add Received Quantity for ${initialData?.name ?? 'Product'} - ${initialData?.sku ?? ''}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {actionType === 'create' && (
          <CreateProductForm onSuccess={onSuccess} resetDialog={resetDialog} />
        )}

        {actionType === 'edit' && initialData && (
          <UpdateProductForm
            initialData={initialData}
            onSuccess={onSuccess}
            resetDialog={resetDialog}
          />
        )}

        {actionType === 'add-received' && initialData && (
          <AddReceivedForm product={initialData} onSuccess={onSuccess} resetDialog={resetDialog} />
        )}
      </DialogContent>
    </Dialog>
  );
};
