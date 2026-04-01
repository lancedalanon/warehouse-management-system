import { type FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/utils/format-compact-number';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusCardProps {
  type: string;
  count?: number;
  isLoading?: boolean;
}

export const StatusCard: FC<StatusCardProps> = ({ type, count, isLoading }) => {
  const colorClass = type.toLowerCase();

  return (
    <Card className="relative min-w-[160px] flex-1 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
      {/* Left accent bar */}
      <div className={cn('absolute top-0 left-0 h-full w-1.5', `bg-${colorClass}`)} />

      <CardContent className="flex flex-col gap-3 p-4">
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', `bg-${colorClass}`)} />
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <p className="text-muted-foreground text-sm font-medium">{type}</p>
          )}
        </div>

        {/* Big number */}
        <div className="flex items-end gap-2">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-3xl font-bold tracking-tight">
              {formatCompactNumber(count!, { compactThreshold: 1_000_000 })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
