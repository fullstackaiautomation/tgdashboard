// Story 5.2: Daily Progress Calculator
// Calculates expected progress by time of day and determines if user is on track

export type ProgressStatus = 'ahead' | 'on-track' | 'behind' | 'critical';

export interface DailyProgressResult {
  actualProgress: number;
  expectedProgress: number;
  status: ProgressStatus;
  color: 'green' | 'yellow' | 'red';
  message: string;
}

/**
 * Calculate expected progress percentage based on current time of day
 *
 * Progress curve:
 * - 6am-9am: 0-10% (morning startup)
 * - 9am-12pm: 10-30% (morning work block)
 * - 12pm-1pm: 30-35% (lunch)
 * - 1pm-3pm: 35-55% (afternoon work block)
 * - 3pm-6pm: 55-80% (late afternoon)
 * - 6pm-9pm: 80-100% (evening wrap up)
 * - 9pm+: 100% (day complete)
 */
export const calculateExpectedProgress = (currentHour: number, isWeekend: boolean = false): number => {
  // Weekends have a more relaxed curve
  if (isWeekend) {
    if (currentHour < 9) return 0;
    if (currentHour < 12) return 15;
    if (currentHour < 15) return 35;
    if (currentHour < 18) return 55;
    if (currentHour < 21) return 75;
    return 100;
  }

  // Weekday curve
  if (currentHour < 6) return 0; // Night/early morning
  if (currentHour < 9) return 10; // Morning startup (6am-9am)
  if (currentHour < 12) return 30; // Morning work (9am-12pm)
  if (currentHour < 13) return 35; // Lunch (12pm-1pm)
  if (currentHour < 15) return 55; // Afternoon work (1pm-3pm)
  if (currentHour < 18) return 80; // Late afternoon (3pm-6pm)
  if (currentHour < 21) return 95; // Evening (6pm-9pm)
  return 100; // After 9pm
};

/**
 * Determine progress status based on actual vs expected progress
 */
export const determineProgressStatus = (
  actualProgress: number,
  expectedProgress: number
): { status: ProgressStatus; color: 'green' | 'yellow' | 'red' } => {
  const difference = actualProgress - expectedProgress;

  if (difference >= 0) {
    // On track or ahead
    return {
      status: difference >= 10 ? 'ahead' : 'on-track',
      color: 'green',
    };
  }

  // Behind schedule
  if (difference >= -20) {
    return {
      status: 'behind',
      color: 'yellow',
    };
  }

  // Critically behind
  return {
    status: 'critical',
    color: 'red',
  };
};

/**
 * Get progress status message
 */
export const getProgressMessage = (
  actualProgress: number,
  expectedProgress: number,
  status: ProgressStatus
): string => {
  const difference = Math.abs(actualProgress - expectedProgress);

  switch (status) {
    case 'ahead':
      return `${difference.toFixed(0)}% ahead of schedule!`;
    case 'on-track':
      return 'On track for the day';
    case 'behind':
      return `${difference.toFixed(0)}% behind schedule`;
    case 'critical':
      return `${difference.toFixed(0)}% behind - needs attention!`;
  }
};

/**
 * Calculate complete daily progress result
 */
export const calculateDailyProgress = (actualProgress: number): DailyProgressResult => {
  const now = new Date();
  const currentHour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const expectedProgress = calculateExpectedProgress(currentHour, isWeekend);
  const { status, color } = determineProgressStatus(actualProgress, expectedProgress);
  const message = getProgressMessage(actualProgress, expectedProgress, status);

  return {
    actualProgress,
    expectedProgress,
    status,
    color,
    message,
  };
};

/**
 * Check if user is falling behind (for triggering alerts)
 */
export const isFallingBehind = (actualProgress: number): boolean => {
  const result = calculateDailyProgress(actualProgress);
  return result.status === 'behind' || result.status === 'critical';
};
