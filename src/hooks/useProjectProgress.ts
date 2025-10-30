import { useMemo } from 'react';
import type { Phase } from '../types/project';
import type { TaskHub } from '../types/task';

interface ProjectProgress {
  progress: number;
  completedPhases: number;
  totalPhases: number;
  lastActivityDate: string | null;
  isStalled: boolean;
}

/**
 * Calculate project completion percentage based on phases and tasks
 * Formula:
 * - If project has phases: (Sum of all phase completion %) / (Number of phases)
 * - If project has no phases but has tasks: (Completed tasks) / (Total tasks) × 100
 *
 * @param phases - Array of phases for the project
 * @param tasks - Array of all tasks (to handle projects without phases)
 * @returns ProjectProgress object with progress %, phase counts, activity status
 */
export const useProjectProgress = (
  phases: Phase[],
  tasks: TaskHub[]
): ProjectProgress => {
  return useMemo(() => {
    // If project has phases, calculate from phase progress
    if (phases && phases.length > 0) {
      // Calculate progress for each phase
      const phaseProgresses = phases.map((phase) => {
        const phaseTasks = tasks.filter((task) => task.phase_id === phase.id);

        if (phaseTasks.length === 0) return 0;

        const totalProgress = phaseTasks.reduce(
          (sum, task) => sum + (task.progress_percentage ?? 0),
          0
        );

        return totalProgress / phaseTasks.length;
      });

      const averageProgress = phaseProgresses.reduce((sum, p) => sum + p, 0) / phases.length;
      const completedPhases = phaseProgresses.filter((p) => p === 100).length;

      // Find most recent task activity
      const lastActivityDate = tasks.length > 0
        ? tasks.reduce((latest, task) => {
            const taskDate = task.updated_at || task.created_at;
            return !latest || taskDate > latest ? taskDate : latest;
          }, null as string | null)
        : null;

      // Check if stalled (no activity in 7+ days)
      const isStalled = lastActivityDate
        ? new Date().getTime() - new Date(lastActivityDate).getTime() > 7 * 24 * 60 * 60 * 1000
        : false;

      return {
        progress: Math.round(averageProgress * 10) / 10,
        completedPhases,
        totalPhases: phases.length,
        lastActivityDate,
        isStalled,
      };
    }

    // If no phases, calculate directly from tasks
    if (tasks && tasks.length > 0) {
      const totalProgress = tasks.reduce(
        (sum, task) => sum + (task.progress_percentage ?? 0),
        0
      );
      const averageProgress = totalProgress / tasks.length;
      const completedTasks = tasks.filter((task) => (task.progress_percentage ?? 0) === 100).length;

      const lastActivityDate = tasks.reduce((latest, task) => {
        const taskDate = task.updated_at || task.created_at;
        return !latest || taskDate > latest ? taskDate : latest;
      }, null as string | null);

      const isStalled = lastActivityDate
        ? new Date().getTime() - new Date(lastActivityDate).getTime() > 7 * 24 * 60 * 60 * 1000
        : false;

      return {
        progress: Math.round(averageProgress * 10) / 10,
        completedPhases: completedTasks,
        totalPhases: tasks.length,
        lastActivityDate,
        isStalled,
      };
    }

    // No phases and no tasks
    return {
      progress: 0,
      completedPhases: 0,
      totalPhases: 0,
      lastActivityDate: null,
      isStalled: false,
    };
  }, [phases, tasks]);
};
