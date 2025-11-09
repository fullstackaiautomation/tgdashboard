import { useMemo } from 'react';
import type { Project, Phase } from '../types/project';
import type { TaskHub } from '../types/task';

export interface ProjectMetrics {
  totalPhases: number;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  completionStatus: 'Not Started' | 'In Progress' | 'Completed';
  estimatedHours: number;
  actualHours: number;
  hoursAccuracy: number;
  estimationAccuracy: 'Accurate' | 'Underestimated' | 'Overestimated' | 'No Data';
  timelineAccuracyDays: number | null;
  isOverdue: boolean;
}

/**
 * Calculate comprehensive metrics for a specific project
 *
 * @param project - The project to calculate metrics for
 * @param phases - All phases (will be filtered by project_id)
 * @param tasks - All tasks (will be filtered by project_id)
 * @returns ProjectMetrics object with all calculations
 */
export const useProjectMetrics = (
  project: Project | null,
  phases: Phase[] | undefined,
  tasks: TaskHub[] | undefined
): ProjectMetrics => {
  return useMemo(() => {
    if (!project) {
      return {
        totalPhases: 0,
        totalTasks: 0,
        completedTasks: 0,
        completionPercentage: 0,
        completionStatus: 'Not Started',
        estimatedHours: 0,
        actualHours: 0,
        hoursAccuracy: 0,
        estimationAccuracy: 'No Data',
        timelineAccuracyDays: null,
        isOverdue: false,
      };
    }

    // Filter phases for this project
    const projectPhases = phases?.filter(p => p.project_id === project.id) || [];
    const totalPhases = projectPhases.length;

    // Filter tasks for this project
    const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];
    const totalTasks = projectTasks.length;

    // Calculate task completion metrics
    const completedTasks = projectTasks.filter(t => (t.progress_percentage ?? 0) === 100).length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Determine completion status
    let completionStatus: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started';
    if (completionPercentage === 100) {
      completionStatus = 'Completed';
    } else if (completionPercentage > 0) {
      completionStatus = 'In Progress';
    }

    // Calculate hours metrics
    const estimatedHours = projectTasks.reduce((sum, task) => sum + (task.hours_projected ?? 0), 0);
    const actualHours = projectTasks.reduce((sum, task) => sum + (task.hours_worked ?? 0), 0);
    const hoursAccuracy = estimatedHours > 0 ? actualHours - estimatedHours : 0;

    // Determine estimation accuracy
    let estimationAccuracy: 'Accurate' | 'Underestimated' | 'Overestimated' | 'No Data' = 'No Data';
    if (estimatedHours > 0) {
      const percentageDifference = (hoursAccuracy / estimatedHours) * 100;
      if (Math.abs(percentageDifference) <= 10) {
        estimationAccuracy = 'Accurate';
      } else if (percentageDifference > 10) {
        estimationAccuracy = 'Underestimated';
      } else {
        estimationAccuracy = 'Overestimated';
      }
    }

    // Calculate timeline accuracy
    let timelineAccuracyDays: number | null = null;
    let isOverdue = false;
    if (project.project_estimated_completion && project.project_completion_date) {
      const estimatedDate = new Date(project.project_estimated_completion).getTime();
      const completionDate = new Date(project.project_completion_date).getTime();
      timelineAccuracyDays = Math.floor((completionDate - estimatedDate) / (1000 * 60 * 60 * 24));
    } else if (project.project_estimated_completion && completionStatus !== 'Completed') {
      // Project not completed yet, check if it's overdue
      const estimatedDate = new Date(project.project_estimated_completion).getTime();
      const today = new Date().getTime();
      isOverdue = today > estimatedDate;
    }

    return {
      totalPhases,
      totalTasks,
      completedTasks,
      completionPercentage: Math.round(completionPercentage * 10) / 10,
      completionStatus,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10,
      hoursAccuracy: Math.round(hoursAccuracy * 10) / 10,
      estimationAccuracy,
      timelineAccuracyDays,
      isOverdue,
    };
  }, [project, phases, tasks]);
};
