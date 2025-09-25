import type { TaskStatus } from '@/gen/management/types.gen';

/**
 * Get the appropriate color for a task status
 */
export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'RUNNING':
      return 'info';
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'CANCELLED':
      return 'warning';
    case 'SCHEDULED':
      return 'primary';
    case 'STOPPING':
      return 'orange';
    default:
      return 'grey';
  }
}

/**
 * Abbreviated month names for date formatting
 */
export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Format a date string into a readable format with ordinal suffix
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);

    // Get day with ordinal suffix
    const day = date.getDate();
    const getOrdinalSuffix = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    const dayWithSuffix = day + getOrdinalSuffix(day);

    // Get month name
    const month = MONTHS[date.getMonth()];

    // Get year
    const year = date.getFullYear();

    // Get time in HH:MM:SS format
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${dayWithSuffix} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateString;
  }
}
