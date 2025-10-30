import type { TaskHub } from '../types/task';

export interface VelocityData {
  velocity: number; // tasks per day
  completedLast30Days: number;
  estimatedDaysRemaining: number | null;
  estimatedCompletionDate: Date | null;
}

/**
 * Calculate project velocity based on task completion rate
 * Uses 30-day rolling window for stability
 *
 * @param tasks - Array of all tasks in the project
 * @returns Velocity metrics and estimated completion
 */
export const calculateVelocity = (tasks: TaskHub[]): VelocityData => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Find tasks completed in last 30 days
  const recentlyCompleted = tasks.filter((task) => {
    if ((task.progress_percentage ?? 0) !== 100) return false;
    if (!task.updated_at) return false;

    const updatedDate = new Date(task.updated_at);
    return updatedDate > thirtyDaysAgo;
  });

  const velocity = recentlyCompleted.length / 30; // tasks per day

  // Calculate remaining work
  const remainingTasks = tasks.filter((t) => (t.progress_percentage ?? 0) < 100).length;

  // Estimate completion if velocity > 0
  let estimatedDaysRemaining: number | null = null;
  let estimatedCompletionDate: Date | null = null;

  if (velocity > 0 && remainingTasks > 0) {
    estimatedDaysRemaining = Math.ceil(remainingTasks / velocity);
    estimatedCompletionDate = new Date(now.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
  }

  return {
    velocity,
    completedLast30Days: recentlyCompleted.length,
    estimatedDaysRemaining,
    estimatedCompletionDate,
  };
};

/**
 * Format estimated completion date for display
 *
 * @param date - Estimated completion date
 * @returns Formatted string like "Est. Dec 15, 2025"
 */
export const formatEstimatedCompletion = (date: Date | null): string => {
  if (!date) return 'Unable to estimate';

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `Est. ${formatter.format(date)}`;
};

/**
 * Get velocity status message
 *
 * @param velocity - Tasks completed per day
 * @param remainingTasks - Number of incomplete tasks
 * @returns Human-readable status message
 */
export const getVelocityStatus = (velocity: number, remainingTasks: number): string => {
  if (remainingTasks === 0) return 'Complete';
  if (velocity === 0) return 'No recent progress';
  if (velocity < 0.1) return 'Very slow progress';
  if (velocity < 0.5) return 'Slow progress';
  if (velocity < 1) return 'Moderate progress';
  return 'Good progress';
};
