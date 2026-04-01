import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export class DayJsHelper {
  /** Format a date to a readable format: Feb 1, 2026 */
  static formatDate(date: string | Date): string {
    return dayjs(date).format('MMM D, YYYY');
  }

  /** Format a time: 2:35 PM */
  static formatTime(date: string | Date): string {
    return dayjs(date).format('h:mm A');
  }

  /** Full datetime: Feb 1, 2026, 2:35 PM */
  static formatDateTime(date: string | Date): string {
    return dayjs(date).format('MMM D, YYYY, h:mm A');
  }

  /** Format ISO date for inputs: YYYY-MM-DD */
  static formatISODate(date: string | Date): string {
    return dayjs(date).format('YYYY-MM-DD');
  }

  /** Relative time: "2 hours ago", "in 5 days" */
  static fromNow(date: string | Date): string {
    return dayjs(date).fromNow();
  }

  /** Duration in seconds HH:mm:ss */
  static formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  /** Convert to UTC ISO string */
  static toUTC(date: string | Date): string {
    return dayjs(date).utc().toISOString();
  }

  /** Parse UTC string back to local */
  static fromUTC(utcDate: string | Date): Date {
    return dayjs.utc(utcDate).toDate();
  }
}
