import { useEffect } from 'react';
import type { Project } from '../types/project';
import type { TaskHub } from '../types/task';
import { useUpdateProject } from './useProjects';

/**
 * Hook that automatically sets project_completion_date when a project reaches 100% completion
 * This should be called when project metrics change to check if completion date needs updating
 */
export const useProjectAutoCompletion = (
  project: Project | null,
  completionPercentage: number
) => {
  const updateProject = useUpdateProject();

  useEffect(() => {
    if (!project) return;

    // Only auto-complete if:
    // 1. Project is at 100% completion
    // 2. No completion date is set yet
    // 3. Project has tasks
    if (
      completionPercentage === 100 &&
      !project.project_completion_date &&
      project.id
    ) {
      // Set completion date to now
      updateProject.mutate({
        id: project.id,
        updates: {
          project_completion_date: new Date().toISOString(),
        },
      });
    }
  }, [completionPercentage, project?.id, project?.project_completion_date, updateProject]);
};
