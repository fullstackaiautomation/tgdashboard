// Story 5.1: Area Priority Calculation Utility
// Calculates priority levels for review dashboard areas

export type PriorityLevel = 'critical' | 'warning' | 'normal';

export interface PriorityInput {
  progressPercentage: number;
  overdueTasks: number;
  lastUpdated: Date | null;
}

/**
 * Calculate priority level for an area based on multiple factors
 *
 * Priority Rules:
 * - Critical (red): progress <20% OR overdue >3 items OR no activity >7 days
 * - Warning (yellow): progress 20-40% OR overdue 1-2 items OR no activity 3-7 days
 * - Normal (gray): progress >40% AND no overdue AND recent activity
 */
export const calculatePriorityLevel = (input: PriorityInput): PriorityLevel => {
  const { progressPercentage, overdueTasks, lastUpdated } = input;

  // Calculate days since last update
  const daysSinceUpdate = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
    : 999; // If never updated, treat as very stale

  // Critical conditions
  if (
    progressPercentage < 20 ||
    overdueTasks > 3 ||
    daysSinceUpdate > 7
  ) {
    return 'critical';
  }

  // Warning conditions
  if (
    (progressPercentage >= 20 && progressPercentage < 40) ||
    (overdueTasks >= 1 && overdueTasks <= 3) ||
    (daysSinceUpdate >= 3 && daysSinceUpdate <= 7)
  ) {
    return 'warning';
  }

  // Normal (all good)
  return 'normal';
};

/**
 * Check if an area needs attention (critical or warning)
 */
export const needsAttention = (priorityLevel: PriorityLevel): boolean => {
  return priorityLevel === 'critical' || priorityLevel === 'warning';
};

/**
 * Get priority sort order (lower is higher priority)
 */
export const getPrioritySortOrder = (priorityLevel: PriorityLevel): number => {
  const priorityOrder: Record<PriorityLevel, number> = {
    critical: 0,
    warning: 1,
    normal: 2,
  };
  return priorityOrder[priorityLevel];
};

/**
 * Sort areas by priority (critical first, then warning, then normal)
 */
export const sortByPriority = <T extends { priorityLevel: PriorityLevel }>(
  areas: T[]
): T[] => {
  return [...areas].sort((a, b) => {
    return getPrioritySortOrder(a.priorityLevel) - getPrioritySortOrder(b.priorityLevel);
  });
};
