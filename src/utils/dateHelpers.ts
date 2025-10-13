/**
 * Date helper utilities for consistent timezone handling across the application
 *
 * IMPORTANT: All date operations use local timezone to prevent UTC conversion issues
 * For date comparisons, dates are normalized to midnight local time
 * For date storage, dates are set to noon to avoid DST boundary issues
 */

/**
 * Parse a date string in local timezone - FIXED VERSION
 * Handles both YYYY-MM-DD and ISO date strings
 * @param dateString - Date string in YYYY-MM-DD or ISO format
 * @returns Date object in local timezone or null
 */
export const parseLocalDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  // If it's already an ISO string with time, parse it directly
  if (dateString.includes('T')) {
    return new Date(dateString);
  }

  // For YYYY-MM-DD format, parse components to avoid UTC interpretation
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;

  // Create date in local timezone at noon to avoid DST issues
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date;
};

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * @param date - Date object to format
 * @returns YYYY-MM-DD formatted string
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date at midnight in local timezone
 * @returns Date object set to today at midnight local time
 */
export const getTodayMidnight = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

/**
 * Get today's date at noon in local timezone (for storage)
 * @returns Date object set to today at noon local time
 */
export const getTodayNoon = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
};

/**
 * Check if a date string represents today in local timezone
 * @param dateString - Date string to check
 * @returns true if the date is today
 */
export const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (!date) return false;

  const today = getTodayMidnight();
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  return checkDate.getTime() === today.getTime();
};

/**
 * Check if a date string is overdue (before today) in local timezone
 * @param dateString - Date string to check
 * @returns true if the date is before today
 */
export const isOverdue = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (!date) return false;

  const today = getTodayMidnight();
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  return checkDate.getTime() < today.getTime();
};

/**
 * Check if a date is tomorrow
 * @param dateString - Date string to check
 * @returns true if the date is tomorrow
 */
export const isTomorrow = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = parseLocalDate(dateString);
  if (!date) return false;

  const tomorrow = getTodayMidnight();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  return checkDate.getTime() === tomorrow.getTime();
};

/**
 * Parse a date string for Calendar component display (at midnight)
 * This is specifically for react-day-picker Calendar which needs dates at midnight
 * for correct visual highlighting
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at midnight local time or null
 */
export const parseLocalDateForDisplay = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;

  // If it's an ISO string with time, extract date portion
  if (dateString.includes('T')) {
    const isoDate = new Date(dateString);
    return new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate(), 0, 0, 0, 0);
  }

  // For YYYY-MM-DD format, parse components and create at MIDNIGHT
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return null;

  // Create at midnight (00:00) for calendar display to avoid visual timezone shifts
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};