import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, UserCheck } from 'lucide-react';
import type { InvitationRequest } from '@/features/invitation-requests/types/invitation-request.types';
import type { AppDispatch, RootState } from '@/stores';
import { createUserThunk } from '@/features/users/stores/user.thunks';
import { toast } from 'sonner';

interface AcceptRequestAndCreateUserDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedInvitee: InvitationRequest | null;
  onSuccess: () => void;
}

export const AcceptRequestAndCreateUserDialog = ({
  open,
  setOpen,
  selectedInvitee,
  onSuccess,
}: AcceptRequestAndCreateUserDialogProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const isCreating = useSelector((state: RootState) => state.users.status.create === 'loading');

  if (!selectedInvitee) return null;

  const handleAccept = async () => {
    const payload = {
      firstName: selectedInvitee.firstName,
      middleName: selectedInvitee.middleName ?? '',
      lastName: selectedInvitee.lastName,
      suffix: selectedInvitee.suffix ?? '',
      email: selectedInvitee.email,
      token: selectedInvitee.token,
      roleId: Number(selectedInvitee.roleId),
    };

    const result = await dispatch(createUserThunk(payload));

    if (createUserThunk.fulfilled.match(result)) {
      toast.success('User created successfully!');
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isCreating && setOpen(val)}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[450px]">
        <div className="bg-primary/5 p-6 pb-4">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2">
              <div className="bg-primary/10 rounded-full p-2">
                <UserCheck className="text-primary h-5 w-5" />
              </div>
              <DialogTitle className="text-xl">Approve Request</DialogTitle>
            </div>
            <DialogDescription>
              This will create a permanent user account for this invitee.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-4">
          {/* Identity Section */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <DataField label="First Name" value={selectedInvitee.firstName} />
            <DataField label="Last Name" value={selectedInvitee.lastName} />
            <DataField label="Middle Name" value={selectedInvitee.middleName || '—'} />
            <DataField label="Suffix" value={selectedInvitee.suffix || '—'} />
          </div>

          <Separator />

          {/* Contact & Role Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Email Address</span>
              <span className="text-sm font-semibold">{selectedInvitee.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Assigned Role</span>
              <Badge variant="secondary" className="capitalize">
                {selectedInvitee.role?.name ?? 'No Role'}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/30 mt-0 gap-2 px-6 py-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={isCreating} className="min-w-[160px]">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Accept & Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for clean layout
const DataField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="text-muted-foreground/80 text-[10px] font-bold tracking-wider uppercase">
      {label}
    </span>
    <span className="truncate text-sm font-medium">{value || '—'}</span>
  </div>
);
