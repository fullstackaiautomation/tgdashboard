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
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly/biweekly tasks
  monthlyDayOfMonth?: number; // 1-31 for monthly tasks (day of month)
}

export interface GeneratedRecurringTasks {
  parentTask: CreateTaskDTO;
  childTasks: CreateTaskDTO[];
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
 * Generate recurring tasks for the week with parent template
 * @param config Recurring task configuration
 * @returns Parent template task and child instances
 */
export function generateRecurringTaskWithChildren(config: RecurringTaskConfig): GeneratedRecurringTasks {
  const { baseName, recurringType, startDate, taskTemplate, dayOfWeek = 1, monthlyDayOfMonth = 15 } = config;
  const childTasks: CreateTaskDTO[] = [];

  // Ensure startDate is a Sunday
  const weekStart = new Date(startDate);
  weekStart.setUTCHours(0, 0, 0, 0);

  // Create parent task WITHOUT date suffix (this is the template)
  // Explicitly exclude due_date so parent template has no specific date
  const { due_date: _ignoredDueDate, ...parentBase } = taskTemplate;
  const parentTask: CreateTaskDTO = {
    ...parentBase,
    task_name: baseName,
    recurring_type: recurringType as 'weekly' | 'monthly' | 'daily_weekdays',
    recurring_interval: recurringType === 'biweekly' ? 2 : 1,
    is_recurring_template: true,
  };

  // Generate child instances with dates
  if (recurringType === 'weekdays') {
    // Create tasks for Monday-Friday (indices 1-5)
    for (let i = 1; i <= 5; i++) {
      const taskDate = new Date(weekStart);
      taskDate.setDate(taskDate.getDate() + i);

      const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

      const { due_date: _ignored, ...childBase } = taskTemplate;
      childTasks.push({
        ...childBase,
        task_name: taskName,
        due_date: taskDate.toISOString(),
        recurring_type: 'daily_weekdays',
        recurring_interval: 1,
        is_recurring_template: false,
        recurring_parent_id: undefined, // Will be set after parent is created
      });
    }
  } else if (recurringType === 'weekly') {
    // Create task for selected day of week
    const taskDate = new Date(weekStart);
    taskDate.setDate(taskDate.getDate() + dayOfWeek);

    const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

    const { due_date: _ignored2, ...childBase2 } = taskTemplate;
    childTasks.push({
      ...childBase2,
      task_name: taskName,
      due_date: taskDate.toISOString(),
      recurring_type: 'weekly',
      recurring_interval: 1,
      is_recurring_template: false,
      recurring_parent_id: undefined,
    });
  } else if (recurringType === 'biweekly') {
    // Create task for selected day of week
    const taskDate = new Date(weekStart);
    taskDate.setDate(taskDate.getDate() + dayOfWeek);

    const taskName = `${baseName} ${formatDateForTask(taskDate)}`;

    const { due_date: _ignored3, ...childBase3 } = taskTemplate;
    childTasks.push({
      ...childBase3,
      task_name: taskName,
      due_date: taskDate.toISOString(),
      recurring_type: 'weekly',
      recurring_interval: 2,
      is_recurring_template: false,
      recurring_parent_id: undefined,
    });
  } else if (recurringType === 'monthly') {
    // Create task for selected day of month (1-31)
    // Use the provided monthlyDayOfMonth, or fall back to current date's day of month
    const taskDate = new Date(weekStart);
    const currentMonth = taskDate.getMonth();
    const currentYear = taskDate.getFullYear();

    // Set the task date to the specified day of month
    // If the day doesn't exist in this month (e.g., Feb 31), use the last day of month
    const targetDate = new Date(currentYear, currentMonth, Math.min(monthlyDayOfMonth, new Date(currentYear, currentMonth + 1, 0).getDate()));
    targetDate.setUTCHours(0, 0, 0, 0);

    const taskName = `${baseName} ${formatDateForTask(targetDate)}`;

    const { due_date: _ignored4, ...childBase4 } = taskTemplate;
    childTasks.push({
      ...childBase4,
      task_name: taskName,
      due_date: targetDate.toISOString(),
      recurring_type: 'monthly',
      recurring_interval: 1,
      is_recurring_template: false,
      recurring_parent_id: undefined,
    });
  }

  return { parentTask, childTasks };
}

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
        is_recurring_template: true,
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
      is_recurring_template: true,
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
      is_recurring_template: true,
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
      is_recurring_template: true,
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