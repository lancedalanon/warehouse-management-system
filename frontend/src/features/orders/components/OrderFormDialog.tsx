'use client';

import { type FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { CreateOrderForm } from './CreateOrderForm';
import type { Order } from '@/features/orders/types/order.types';
import { UpdateOrderForm } from './UpdateOrderForm';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  actionType: 'create' | 'edit';
  initialData?: Order;
  onSuccess?: () => void;
}

export const OrderFormDialog: FC<Props> = ({
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
        return 'Create Order';
      case 'edit':
        return `Update Order ${initialData?.code ?? ''}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[95vh] max-w-6xl min-w-full flex-col overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {actionType === 'create' && (
          <CreateOrderForm onSuccess={onSuccess} resetDialog={resetDialog} />
        )}

        {actionType === 'edit' && initialData && (
          <UpdateOrderForm order={initialData} onSuccess={onSuccess} resetDialog={resetDialog} />
        )}
      </DialogContent>
    </Dialog>
  );
};
