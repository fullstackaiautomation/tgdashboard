/**
 * Parse a date string (YYYY-MM-DD) in local timezone instead of UTC
 * This prevents timezone shifts when displaying/selecting dates
 */
export const parseLocalDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  // If it's already a full ISO string with time, just parse it
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  // For YYYY-MM-DD format, append local midnight time to prevent UTC conversion
  // This ensures the date stays in local timezone
  return new Date(dateString + 'T00:00:00');
};

/**
 * Format a date to YYYY-MM-DD string in local timezone
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string represents today in local timezone
 */
export const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (!date) return false;

  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

/**
 * Check if a date string is overdue (before today) in local timezone
 */
export const isOverdue = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
};