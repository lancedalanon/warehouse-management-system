import { useAppSelector } from '@/stores/hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AccountSection } from '@/features/auth/components/AccountSection';
import { EmailSection } from '@/features/auth/components/EmailSection';
import { PasswordSection } from '@/features/auth/components/PasswordSection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const ProfilePage = () => {
  const { user, authStatus } = useAppSelector((state) => state.auth);
  const isEmailVerified = Boolean(user?.emailVerifiedAt);

  if (authStatus === 'loading') {
    return (
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6 text-center">
        <Card className="w-full max-w-md border-dashed shadow-none">
          <CardContent className="flex flex-col items-center space-y-4 pt-10 pb-10">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">User Profile Not Found</h3>
              <p className="text-muted-foreground text-sm">
                Please try refreshing the page or logging in again.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-slate-50/50">
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        <header>
          {!isEmailVerified && (
            <Alert className="mb-6 flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
              <div className="flex-1 space-y-1">
                <AlertTitle className="text-sm font-semibold text-amber-800">
                  Email not verified
                </AlertTitle>
                <AlertDescription className="text-sm leading-relaxed text-amber-700">
                  Your account is limited until you verify your email address. Please check your
                  inbox for a verification link or use the Verify Email button below.
                </AlertDescription>
              </div>
            </Alert>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your identity, contact information, and security.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <AccountSection user={user} />
          <Separator className="md:col-span-3" />
          <EmailSection user={user} />
          <Separator className="md:col-span-3" />
          <PasswordSection />
        </div>
      </div>
    </ScrollArea>
  );
};

export default ProfilePage;
