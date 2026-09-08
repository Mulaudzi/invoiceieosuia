import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const parseDateSafe = (value: unknown): Date | null => {
  if (value instanceof Date) return isValid(value) ? value : null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
};

export const formatDateSafe = (
  value: unknown,
  pattern = 'MMM d, yyyy',
  fallback = 'N/A',
): string => {
  const parsed = parseDateSafe(value);
  return parsed ? format(parsed, pattern) : fallback;
};

export const formatDistanceSafe = (value: unknown, fallback = 'Unknown time'): string => {
  const parsed = parseDateSafe(value);
  return parsed ? formatDistanceToNow(parsed, { addSuffix: true }) : fallback;
};
