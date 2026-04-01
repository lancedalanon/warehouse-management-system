import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  className?: string;
};

export function StatusBadge({ label, bgColor, textColor, dotColor, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:gap-2 sm:px-3',
        bgColor,
        textColor,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2', dotColor)} />
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}
