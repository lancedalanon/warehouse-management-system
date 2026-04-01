'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDeclineDialogProps {
  name?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export const ConfirmDeclineDialog: React.FC<ConfirmDeclineDialogProps> = ({
  name,
  open,
  setOpen,
  onConfirm,
  loading = false,
}) => {
  const displayName = name ?? 'item';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline {displayName}</DialogTitle>
          <DialogDescription>
            Are you sure you want to decline <strong>{displayName}</strong>? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Declining...' : 'Decline'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
