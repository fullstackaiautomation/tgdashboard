/**
 * Progress color utilities for consistent color coding across the application
 * Color gradient: red (0-33%), yellow (34-66%), green (67-100%)
 */

export type ProgressColor = 'red' | 'yellow' | 'green';

/**
 * Get progress color category based on percentage
 * @param progress - Completion percentage (0-100)
 * @returns Color category: red, yellow, or green
 */
export const getProgressColor = (progress: number): ProgressColor => {
  if (progress < 33) return 'red';
  if (progress < 67) return 'yellow';
  return 'green';
};

/**
 * Get Tailwind background color classes for progress
 * @param progress - Completion percentage (0-100)
 * @returns Tailwind class string for background color
 */
export const getProgressClasses = (progress: number): string => {
  const color = getProgressColor(progress);
  return `bg-${color}-500`;
};

/**
 * Get Tailwind text color classes for progress
 * @param progress - Completion percentage (0-100)
 * @returns Tailwind class string for text color
 */
export const getProgressTextColor = (progress: number): string => {
  const color = getProgressColor(progress);
  return `text-${color}-400`;
};

/**
 * Get Tailwind border color classes for progress
 * @param progress - Completion percentage (0-100)
 * @returns Tailwind class string for border color
 */
export const getProgressBorderColor = (progress: number): string => {
  const color = getProgressColor(progress);
  return `border-${color}-500`;
};

/**
 * Get semantic progress status
 * @param progress - Completion percentage (0-100)
 * @returns Human-readable status
 */
export const getProgressStatus = (progress: number): string => {
  if (progress === 0) return 'Not Started';
  if (progress === 100) return 'Completed';
  if (progress < 33) return 'Just Started';
  if (progress < 67) return 'In Progress';
  return 'Nearly Complete';
};
