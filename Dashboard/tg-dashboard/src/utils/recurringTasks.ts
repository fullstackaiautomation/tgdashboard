import { addDays, addWeeks, addMonths, format } from 'date-fns';
import type { TaskHub, RecurringType } from '../types/task';

/**
 * Generate recurring task instances for the next N days
 * @param parentTask - The parent recurring task template
 * @param daysAhead - Number of days to generate instances for (default: 30)
 * @returns Array of task instance objects ready for database insertion
 */
export function generateRecurringInstances(
  parentTask: TaskHub,
  daysAhead: number = 30
): Partial<TaskHub>[] {
  if (!parentTask.recurrence_pattern || parentTask.recurrence_pattern === 'none') {
    return [];
  }

  const instances: Partial<TaskHub>[] = [];
  const startDate = parentTask.scheduled_date
    ? new Date(parentTask.scheduled_date)
    : new Date();

  let currentDate = new Date(startDate);
  const endDate = addDays(startDate, daysAhead);

  while (currentDate <= endDate) {
    // Skip the first occurrence if it's the parent's scheduled date
    if (currentDate.getTime() !== startDate.getTime()) {
      instances.push({
        ...parentTask,
        id: undefined, // Let database generate new ID
        scheduled_date: format(currentDate, 'yyyy-MM-dd'),
        recurrence_parent_id: parentTask.id,
        is_recurring_template: false,
        created_at: undefined,
        updated_at: undefined,
      });
    }

    // Increment date based on recurrence pattern
    currentDate = getNextOccurrence(currentDate, parentTask.recurrence_pattern);
  }

  return instances;
}

/**
 * Calculate the next occurrence date based on recurrence pattern
 */
function getNextOccurrence(currentDate: Date, pattern: RecurringType): Date {
  switch (pattern) {
    case 'daily':
      return addDays(currentDate, 1);

    case 'daily_weekdays':
      let nextDay = addDays(currentDate, 1);
      // Skip weekends (0 = Sunday, 6 = Saturday)
      while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
        nextDay = addDays(nextDay, 1);
      }
      return nextDay;

    case 'weekly':
      return addWeeks(currentDate, 1);

    case 'monthly':
      return addMonths(currentDate, 1);

    case 'custom':
      // For custom patterns, default to weekly (can be enhanced later)
      return addWeeks(currentDate, 1);

    default:
      return addDays(currentDate, 1);
  }
}

/**
 * Check if a task is a recurring instance (has a parent)
 */
export function isRecurringInstance(task: TaskHub): boolean {
  return task.recurrence_parent_id !== null;
}

/**
 * Check if a task is a recurring template (parent task)
 */
export function isRecurringTemplate(task: TaskHub): boolean {
  return task.is_recurring_template === true;
}

/**
 * Get display label for recurrence pattern
 */
export function getRecurrenceLabel(pattern: RecurringType | null): string {
  switch (pattern) {
    case 'daily':
      return 'Daily';
    case 'daily_weekdays':
      return 'Weekdays';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'custom':
      return 'Custom';
    case 'none':
    default:
      return '';
  }
}
