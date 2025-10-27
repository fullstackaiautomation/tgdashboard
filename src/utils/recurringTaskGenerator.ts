/**
 * Recurring Task Generator Utility
 * Generates recurring task instances for the week
 */

import type { CreateTaskDTO, RecurringType } from '../types/task';

interface RecurringTaskConfig {
  baseName: string;
  recurringType: 'weekdays' | 'weekly' | 'biweekly' | 'monthly';
  startDate: Date; // Sunday of target week
  taskTemplate: CreateTaskDTO;
}

/**
 * Format date as MM/DD/YY
 */
export const formatDateForTask = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
};

/**
 * Get the next Sunday from a given date
 */
export const getNextSunday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilSunday = (7 - day) % 7;
  d.setDate(d.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  return d;
};

/**
 * Get the Sunday of the current week
 */
export const getCurrentWeekSunday = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Generate recurring tasks for the week
 * @param config Recurring task configuration
 * @returns Array of tasks to create
 */
export function generateWeekTasks(config: RecurringTaskConfig): CreateTaskDTO[] {
  const tasks: CreateTaskDTO[] = [];
  const { baseName, recurringType, startDate, taskTemplate } = config;

  // Ensure startDate is a Sunday
  const weekStart = new Date(startDate);
  weekStart.setHours(0, 0, 0, 0);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (recurringType === 'weekdays') {
    // Create tasks for Monday-Friday (indices 1-5)
    for (let i = 1; i <= 5; i++) {
      const taskDate = new Date(weekStart);
      taskDate.setDate(taskDate.getDate() + i);

      const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

      tasks.push({
        ...taskTemplate,
        task_name: taskName,
        due_date: taskDate.toISOString(),
        recurring_type: 'daily_weekdays',
        recurring_interval: 1,
      });
    }
  } else if (recurringType === 'weekly') {
    // Create task for same day of week next week
    // Assume taskTemplate already has the day of week preference
    const taskDate = new Date(weekStart);
    // If we're creating for the upcoming week, we generate for the same day
    taskDate.setDate(taskDate.getDate() + 1); // Start from Monday of the week

    const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

    tasks.push({
      ...taskTemplate,
      task_name: taskName,
      due_date: taskDate.toISOString(),
      recurring_type: 'weekly',
      recurring_interval: 1,
    });
  } else if (recurringType === 'biweekly') {
    // Create task if it falls within this week
    const taskDate = new Date(weekStart);
    taskDate.setDate(taskDate.getDate() + 1); // Monday of the week

    const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

    tasks.push({
      ...taskTemplate,
      task_name: taskName,
      due_date: taskDate.toISOString(),
      recurring_type: 'weekly',
      recurring_interval: 2,
    });
  } else if (recurringType === 'monthly') {
    // Create task for the same date of the month if it falls within the week
    const taskDate = new Date(weekStart);
    taskDate.setDate(taskDate.getDate() + 1); // Start from Monday

    const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

    tasks.push({
      ...taskTemplate,
      task_name: taskName,
      due_date: taskDate.toISOString(),
      recurring_type: 'monthly',
      recurring_interval: 1,
    });
  }

  return tasks;
}

/**
 * Check if a recurring task has already been generated for a specific date
 */
export function isTaskAlreadyGenerated(
  taskName: string,
  recurringType: RecurringType,
  targetDate: Date,
  existingTasks: Array<{ task_name: string; recurring_type: RecurringType; due_date?: string }>
): boolean {
  return existingTasks.some((task) => {
    // Check if task exists with the same date pattern in the name
    const datePattern = formatDateForTask(targetDate);
    return task.task_name.includes(datePattern) && task.recurring_type === recurringType;
  });
}