import type { TaskHub } from '../types/task';
import { differenceInDays } from 'date-fns';

export interface ActivityStatus {
  isStalled: boolean;
  daysSinceActivity: number;
  lastActivityDate: Date | null;
  message: string;
}

/**
 * Check if project is stalled (no task updates in 7+ days)
 *
 * @param tasks - Array of all tasks in the project
 * @returns Activity status with stalled flag and last activity info
 */
export const checkProjectActivity = (tasks: TaskHub[]): ActivityStatus => {
  if (!tasks || tasks.length === 0) {
    return {
      isStalled: true,
      daysSinceActivity: Infinity,
      lastActivityDate: null,
      message: 'No tasks in project',
    };
  }

  // Find most recent task update
  const lastActivity = tasks.reduce<Date | null>((latest, task) => {
    const taskDate = task.updated_at ? new Date(task.updated_at) : task.created_at ? new Date(task.created_at) : null;
    if (!taskDate) return latest;
    if (!latest || taskDate > latest) return taskDate;
    return latest;
  }, null);

  if (!lastActivity) {
    return {
      isStalled: true,
      daysSinceActivity: Infinity,
      lastActivityDate: null,
      message: 'No activity recorded',
    };
  }

  const daysSinceActivity = differenceInDays(new Date(), lastActivity);
  const isStalled = daysSinceActivity > 7;

  return {
    isStalled,
    daysSinceActivity,
    lastActivityDate: lastActivity,
    message: isStalled ? `Last activity ${daysSinceActivity} days ago` : 'Active',
  };
};

/**
 * Get activity badge color based on days since last activity
 *
 * @param daysSinceActivity - Number of days since last task update
 * @returns Tailwind color class
 */
export const getActivityBadgeColor = (daysSinceActivity: number): string => {
  if (daysSinceActivity <= 1) return 'bg-green-600';
  if (daysSinceActivity <= 3) return 'bg-blue-600';
  if (daysSinceActivity <= 7) return 'bg-yellow-600';
  return 'bg-red-600';
};

/**
 * Format last activity date for display
 *
 * @param date - Last activity date
 * @returns Formatted string like "2 days ago" or "Just now"
 */
export const formatLastActivity = (date: Date | null): string => {
  if (!date) return 'Never';

  const days = differenceInDays(new Date(), date);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};
