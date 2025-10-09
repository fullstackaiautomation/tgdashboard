import { useMemo } from 'react';
import type { Project, Phase } from '../types/project';
import type { TaskHub } from '../types/task';

interface BusinessProgress {
  overallCompletion: number;
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  totalTasks: number;
  lastActivityDate: string | null;
  isStalled: boolean;
}

/**
 * Calculate business-level aggregate progress from all projects
 *
 * @param projects - Array of projects for the business
 * @param phases - Array of all phases
 * @param tasks - Array of all tasks
 * @returns BusinessProgress object with aggregate metrics
 */
export const useBusinessProgress = (
  projects: Project[],
  phases: Phase[],
  tasks: TaskHub[]
): BusinessProgress => {
  return useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        overallCompletion: 0,
        totalProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalTasks: 0,
        lastActivityDate: null,
        isStalled: false,
      };
    }

    // Calculate progress for each project
    const projectProgresses = projects.map((project) => {
      const projectPhases = phases.filter((phase) => phase.project_id === project.id);
      const projectTasks = tasks.filter((task) => task.project_id === project.id);

      // Calculate phase progress
      if (projectPhases.length > 0) {
        const phaseProgresses = projectPhases.map((phase) => {
          const phaseTasks = projectTasks.filter((task) => task.phase_id === phase.id);
          if (phaseTasks.length === 0) return 0;

          const totalProgress = phaseTasks.reduce(
            (sum, task) => sum + (task.progress_percentage ?? 0),
            0
          );
          return totalProgress / phaseTasks.length;
        });

        return phaseProgresses.reduce((sum, p) => sum + p, 0) / projectPhases.length;
      }

      // No phases, calculate from tasks
      if (projectTasks.length > 0) {
        const totalProgress = projectTasks.reduce(
          (sum, task) => sum + (task.progress_percentage ?? 0),
          0
        );
        return totalProgress / projectTasks.length;
      }

      return 0;
    });

    // Overall completion = average of all project completions
    const overallCompletion = projectProgresses.reduce((sum, p) => sum + p, 0) / projects.length;

    // Task counts
    const completedTasks = tasks.filter((task) => (task.progress_percentage ?? 0) === 100).length;
    const activeTasks = tasks.filter(
      (task) => (task.progress_percentage ?? 0) > 0 && (task.progress_percentage ?? 0) < 100
    ).length;
    const totalTasks = tasks.length;

    // Find most recent activity
    const lastActivityDate = tasks.length > 0
      ? tasks.reduce((latest, task) => {
          const taskDate = task.updated_at || task.created_at;
          return !latest || taskDate > latest ? taskDate : latest;
        }, null as string | null)
      : null;

    // Check if stalled (no activity in 14+ days for business level)
    const isStalled = lastActivityDate
      ? new Date().getTime() - new Date(lastActivityDate).getTime() > 14 * 24 * 60 * 60 * 1000
      : false;

    return {
      overallCompletion: Math.round(overallCompletion * 10) / 10,
      totalProjects: projects.length,
      activeTasks,
      completedTasks,
      totalTasks,
      lastActivityDate,
      isStalled,
    };
  }, [projects, phases, tasks]);
};
