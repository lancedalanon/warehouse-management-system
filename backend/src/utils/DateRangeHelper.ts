import { DateRange } from '@/types/services/dashboard/dashboard.types';

export function getDateRangeBounds(dateRange: DateRange): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const startDate = new Date(now);
  const endDate = new Date(); // always today

  switch (dateRange) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDate.setMonth(now.getMonth() - 11);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}
