import type { FC } from 'react';
import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { CheckCircle2, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useUpdateTask } from '../../hooks/useTasks';
import { useUndo } from '../../hooks/useUndo';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { ProgressSlider } from '../shared/ProgressSlider';
import type { TaskHub, TaskStatus } from '../../types/task';

interface TaskCardProps {
  task: TaskHub;
  className?: string;
}

/**
 * Get color class for business/area badge
 */
const getColorClass = (task: TaskHub): string => {
  if (task.businesses) {
    const slug = task.businesses.slug;
    if (slug === 'full-stack' || slug === 'fullstack') return 'bg-[var(--color-business-fullstack)]';
    if (slug === 'huge-capital') return 'bg-[var(--color-business-hugecapital)]';
    if (slug === 's4') return 'bg-[var(--color-business-s4)]';
    if (slug === '808') return 'bg-[var(--color-business-808)]';
  }

  if (task.life_areas) {
    const category = task.life_areas.category.toLowerCase();
    if (category === 'personal') return 'bg-[var(--color-area-personal)]';
    if (category === 'health') return 'bg-[var(--color-area-health)]';
    if (category === 'golf') return 'bg-[var(--color-area-golf)]';
  }

  // Fallback to legacy area
  if (task.area) {
    if (task.area === 'Full Stack') return 'bg-[var(--color-business-fullstack)]';
    if (task.area === 'Huge Capital') return 'bg-[var(--color-business-hugecapital)]';
    if (task.area === 'S4') return 'bg-[var(--color-business-s4)]';
    if (task.area === '808') return 'bg-[var(--color-business-808)]';
    if (task.area === 'Personal') return 'bg-[var(--color-area-personal)]';
    if (task.area === 'Health') return 'bg-[var(--color-area-health)]';
    if (task.area === 'Golf') return 'bg-[var(--color-area-golf)]';
  }

  return 'bg-gray-500';
};

/**
 * Get source display name (Business or Life Area)
 */
const getSourceName = (task: TaskHub): string => {
  if (task.businesses) return task.businesses.name;
  if (task.life_areas) return task.life_areas.name;
  if (task.area) return task.area;
  return 'Unknown';
};

/**
 * Check if task is overdue
 */
const isOverdue = (task: TaskHub): boolean => {
  if (!task.due_date || task.progress_percentage === 100) return false;
  return new Date(task.due_date) < new Date();
};

/**
 * Calculate days overdue
 */
const getDaysOverdue = (task: TaskHub): number => {
  if (!task.due_date) return 0;
  return Math.abs(differenceInDays(new Date(), new Date(task.due_date)));
};

/**
 * TaskCard - Displays a single task with business/area color coding and inline editing
 */
export const TaskCard: FC<TaskCardProps> = ({ task, className = '' }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.task_name);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [showProjectPhaseDropdown, setShowProjectPhaseDropdown] = useState(false);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const updateTask = useUpdateTask();
  const { canUndo, setupUndo, executeUndo } = useUndo<TaskHub>(30000);
  const { data: projects } = useProjects(task.business_id || undefined);
  const { data: phases } = usePhases(task.project_id || undefined);

  const colorClass = getColorClass(task);
  const sourceName = getSourceName(task);
  const overdue = isOverdue(task);

  // Default to 0 if progress_percentage is undefined/null
  const progress = task.progress_percentage ?? 0;

  const handleUpdate = async (updates: Partial<TaskHub>) => {
    setSyncStatus('syncing');

    // Setup undo before making change
    const previousTask = { ...task };
    setupUndo(previousTask, () => {
      updateTask.mutate({
        id: task.id,
        updates: previousTask,
      });
    });

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates,
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      console.error('Task update failed:', error);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    // Map status to progress percentage
    let newProgress = progress;
    if (newStatus === 'Not started') {
      newProgress = 0;
    } else if (newStatus === 'Done') {
      newProgress = 100;
    } else if (newStatus === 'In progress' && newProgress === 0) {
      newProgress = 50; // Default to 50% when marking as in progress
    }

    handleUpdate({
      status: newStatus,
      progress_percentage: newProgress,
      completed_at: newStatus === 'Done' ? new Date().toISOString() : undefined,
    });
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.task_name) {
      handleUpdate({ task_name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.task_name);
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionSave = () => {
    if (editedDescription !== (task.description || '')) {
      handleUpdate({ description: editedDescription.trim() || null });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditedDescription(task.description || '');
      setIsEditingDescription(false);
    }
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined;
    handleUpdate({ due_date: newDate });
  };

  const handleProjectPhaseChange = (projectId: string | null, phaseId: string | null) => {
    handleUpdate({
      project_id: projectId,
      phase_id: phaseId,
    });
    setShowProjectPhaseDropdown(false);
  };

  const handleProgressChange = (progress: number) => {
    // Update status based on progress
    let newStatus: TaskStatus = task.status;
    if (progress === 0) {
      newStatus = 'Not started';
    } else if (progress === 100) {
      newStatus = 'Done';
    } else if (progress > 0 && progress < 100) {
      newStatus = 'In progress';
    }

    handleUpdate({
      progress_percentage: progress,
      status: newStatus,
      completed_at: progress === 100 ? new Date().toISOString() : undefined,
    });
  };

  const daysOverdue = overdue ? getDaysOverdue(task) : 0;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border ${
      overdue ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700'
    } hover:border-gray-600 transition-colors ${className}`}>
      <div className="flex items-start gap-3">
        {/* Progress Indicator replaces checkbox */}
        <div
          className="mt-1 cursor-pointer relative"
          onClick={() => setShowProgressSlider(!showProgressSlider)}
        >
          <ProgressIndicator progress={progress} size="md" />

          {/* Progress Slider Popup */}
          {showProgressSlider && (
            <div className="absolute top-full left-0 mt-2 z-20">
              <ProgressSlider
                progress={progress}
                onChange={handleProgressChange}
                onClose={() => setShowProgressSlider(false)}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Task Title & Status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="flex-1 text-lg font-medium bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className={`text-lg font-medium cursor-pointer hover:text-orange-400 transition-colors ${
                  progress === 100 ? 'line-through text-gray-500 opacity-75' : 'text-gray-100'
                }`}
              >
                {task.task_name}
              </h3>
            )}

            {/* Status Dropdown & Indicators */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Sync Status Indicator */}
              {syncStatus === 'syncing' && (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              {syncStatus === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
              {syncStatus === 'error' && (
                <div title="Sync failed - changes may not be saved">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
              )}

              {/* Undo Button */}
              {canUndo && (
                <button
                  onClick={executeUndo}
                  className="px-2 py-1 text-xs font-medium bg-yellow-900/30 text-yellow-400 rounded border border-yellow-500/50 hover:bg-yellow-900/50 transition-colors"
                >
                  Undo
                </button>
              )}

              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded border border-gray-600 hover:border-gray-500 focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Not started">Not Started</option>
                <option value="In progress">In Progress</option>
                <option value="Done">Done</option>
              </select>

              {/* Overdue Badge */}
              {overdue && (
                <span className="px-2 py-1 text-xs font-medium bg-red-900/30 text-red-400 rounded border border-red-500/50 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Overdue {daysOverdue > 0 && `(${daysOverdue}d)`}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            {isEditingDescription ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyDown}
                autoFocus
                rows={3}
                placeholder="Add description..."
                className="w-full text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
              />
            ) : (
              <p
                onClick={() => setIsEditingDescription(true)}
                className={`text-sm cursor-pointer hover:text-gray-300 transition-colors ${
                  task.description ? 'text-gray-400' : 'text-gray-500 italic'
                }`}
              >
                {task.description || 'Click to add description...'}
              </p>
            )}
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Business/Area Badge */}
            <span className={`px-2 py-1 text-xs font-medium text-white rounded ${colorClass}`}>
              {sourceName}
            </span>

            {/* Project > Phase Hierarchy with Edit */}
            {task.business_id && (
              <div className="relative">
                <div
                  onClick={() => setShowProjectPhaseDropdown(!showProjectPhaseDropdown)}
                  className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
                >
                  {task.projects ? (
                    <>
                      <span className="font-medium">{task.projects.name}</span>
                      {task.phases && (
                        <>
                          <span>›</span>
                          <span>{task.phases.name}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="italic text-gray-500">Click to assign project</span>
                  )}
                </div>

                {/* Project/Phase Dropdown */}
                {showProjectPhaseDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-10 bg-gray-700 border border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px]">
                    <div className="mb-2">
                      <label className="text-xs text-gray-400 block mb-1">Project</label>
                      <select
                        value={task.project_id || ''}
                        onChange={(e) => {
                          const projectId = e.target.value || null;
                          handleProjectPhaseChange(projectId, null);
                        }}
                        className="w-full text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">No Project</option>
                        {projects?.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {task.project_id && phases && phases.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Phase</label>
                        <select
                          value={task.phase_id || ''}
                          onChange={(e) => {
                            const phaseId = e.target.value || null;
                            handleProjectPhaseChange(task.project_id, phaseId);
                          }}
                          className="w-full text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="">No Phase</option>
                          {phases.map((phase) => (
                            <option key={phase.id} value={phase.id}>
                              {phase.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Due Date Picker */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''}
                onChange={handleDueDateChange}
                className={`text-xs px-2 py-1 rounded bg-gray-700 border border-gray-600 hover:border-gray-500 focus:border-orange-500 focus:outline-none cursor-pointer ${
                  overdue ? 'text-red-400 font-medium' : 'text-gray-400'
                }`}
              />
            </div>

            {/* Priority */}
            {task.priority && task.priority !== 'Medium' && (
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                task.priority === 'High' ? 'bg-red-900/30 text-red-400' : 'bg-gray-700 text-gray-300'
              }`}>
                {task.priority}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
