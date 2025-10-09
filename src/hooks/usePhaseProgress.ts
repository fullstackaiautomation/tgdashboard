import { useMemo } from 'react';
import type { TaskHub } from '../types/task';

interface PhaseProgress {
  progress: number;
  completedCount: number;
  totalCount: number;
}

/**
 * Calculate phase completion percentage based on task progress
 * Formula: (Sum of task progress_percentage) / (Total number of tasks)
 *
 * @param tasks - Array of tasks for the phase
 * @returns PhaseProgress object with progress %, completed count, and total count
 */
export const usePhaseProgress = (tasks: TaskHub[]): PhaseProgress => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        progress: 0,
        completedCount: 0,
        totalCount: 0,
      };
    }

    // Calculate average progress across all tasks
    const totalProgress = tasks.reduce((sum, task) => {
      const taskProgress = task.progress_percentage ?? 0;
      return sum + taskProgress;
    }, 0);

    const averageProgress = totalProgress / tasks.length;

    // Count completed tasks (100% progress)
    const completedCount = tasks.filter((task) => (task.progress_percentage ?? 0) === 100).length;

    return {
      progress: Math.round(averageProgress * 10) / 10, // Round to 1 decimal place
      completedCount,
      totalCount: tasks.length,
    };
  }, [tasks]);
};
