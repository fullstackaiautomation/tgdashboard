import type { FC } from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { useUndo } from '../../hooks/useUndo';
import type { TaskHub, TaskStatus, UpdateTaskDTO } from '../../types/task';

interface EnhancedTaskCardProps {
  task: TaskHub;
  className?: string;
  onUndo?: (taskId: string, previousValue: any) => void;
}

// Helper functions
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

const getSourceName = (task: TaskHub): string => {
  if (task.businesses) return task.businesses.name;
  if (task.life_areas) return task.life_areas.name;
  if (task.area) return task.area;
  return 'Unknown';
};

const isOverdue = (task: TaskHub): boolean => {
  if (!task.due_date || task.status === 'Done') return false;
  return new Date(task.due_date) < new Date();
};

export const EnhancedTaskCard: FC<EnhancedTaskCardProps> = ({ task, className = '', onUndo: _onUndo }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.task_name);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects } = useProjects(task.business_id || undefined);
  const { data: phases } = usePhases(task.project_id || undefined);
  const { canUndo, setupUndo, executeUndo } = useUndo<TaskHub>();

  const colorClass = getColorClass(task);
  const sourceName = getSourceName(task);
  const overdue = isOverdue(task);
  const isSyncing = updateTask.isPending;

  // Generic update handler with undo support
  const handleUpdate = (updates: UpdateTaskDTO, previousValue: Partial<TaskHub>) => {
    updateTask.mutate(
      { id: task.id, updates },
      {
        onSuccess: () => {
          // Setup undo with previous value
          setupUndo(task, () => {
            updateTask.mutate({ id: task.id, updates: previousValue as UpdateTaskDTO });
          });
        },
      }
    );
  };

  const handleStatusToggle = () => {
    const newStatus: TaskStatus = task.status === 'Done' ? 'Not started' : 'Done';
    const completed_at = newStatus === 'Done' ? new Date().toISOString() : undefined;
    handleUpdate(
      { status: newStatus, completed_at },
      { status: task.status, completed_at: task.completed_at || undefined }
    );
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    const completed_at = newStatus === 'Done' ? new Date().toISOString() : undefined;
    handleUpdate(
      { status: newStatus, completed_at },
      { status: task.status, completed_at: task.completed_at || undefined }
    );
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.task_name) {
      handleUpdate({ task_name: editedTitle.trim() }, { task_name: task.task_name });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (editedDescription !== (task.description || '')) {
      handleUpdate(
        { description: editedDescription.trim() || undefined },
        { description: task.description || undefined }
      );
    }
    setIsEditingDescription(false);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined;
    handleUpdate({ due_date: newDate }, { due_date: task.due_date || undefined });
  };

  const handleProjectChange = (projectId: string) => {
    if (!projectId) return;
    handleUpdate(
      { project_id: projectId, phase_id: undefined },
      { project_id: task.project_id || undefined, phase_id: task.phase_id || undefined }
    );
    setShowMoveDropdown(false);
  };

  const handlePhaseChange = (phaseId: string) => {
    if (!phaseId) return;
    handleUpdate({ phase_id: phaseId }, { phase_id: task.phase_id || undefined });
    setShowMoveDropdown(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete task "${task.task_name}"?`)) {
      deleteTask.mutate(task.id);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors relative ${className}`}>
      {/* Sync Status Indicator */}
      {isSyncing && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Syncing..." />
        </div>
      )}

      {/* Undo Toast */}
      {canUndo && (
        <div className="absolute -top-12 right-0 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
          <span className="text-xs text-gray-300">Change saved</span>
          <button
            onClick={executeUndo}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Undo
          </button>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.status === 'Done'}
          onChange={handleStatusToggle}
          className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900 cursor-pointer"
        />

        <div className="flex-1 min-w-0">
          {/* Task Title & Status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setEditedTitle(task.task_name);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
                className="flex-1 text-lg font-medium bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className={`text-lg font-medium cursor-pointer hover:text-orange-400 transition-colors ${
                  task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-100'
                }`}
              >
                {task.task_name}
              </h3>
            )}

            {/* Status Dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded border border-gray-600 hover:border-gray-500 focus:border-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="Not started">Not Started</option>
                <option value="In progress">In Progress</option>
                <option value="Done">Done</option>
              </select>

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                title="Delete task"
              >
                ×
              </button>

              {overdue && (
                <span className="px-2 py-1 text-xs font-medium bg-red-900/30 text-red-400 rounded border border-red-500/50">
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {isEditingDescription ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              rows={3}
              autoFocus
              className="w-full text-sm bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none mb-3"
            />
          ) : task.description || isEditingDescription ? (
            <p
              onClick={() => setIsEditingDescription(true)}
              className="text-gray-400 text-sm mb-3 cursor-pointer hover:text-gray-300"
            >
              {task.description || 'Add description...'}
            </p>
          ) : (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="text-xs text-gray-500 hover:text-gray-400 mb-3"
            >
              + Add description
            </button>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Business/Area Badge */}
            <span className={`px-2 py-1 text-xs font-medium text-white rounded ${colorClass}`}>
              {sourceName}
            </span>

            {/* Project > Phase Hierarchy with Move Option */}
            {task.projects && (
              <div className="relative">
                <div
                  onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                  className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-gray-300"
                >
                  <span className="font-medium">{task.projects.name}</span>
                  {task.phases && (
                    <>
                      <span>›</span>
                      <span>{task.phases.name}</span>
                    </>
                  )}
                  <span className="text-gray-600">▼</span>
                </div>

                {/* Move Dropdown */}
                {showMoveDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-2 z-10 min-w-[200px]">
                    <div className="text-xs text-gray-400 mb-2">Move to:</div>
                    {projects && projects.length > 0 && (
                      <select
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded mb-2 text-gray-300"
                      >
                        <option value="">Select Project...</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {phases && phases.length > 0 && (
                      <select
                        onChange={(e) => handlePhaseChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-300"
                      >
                        <option value="">Select Phase...</option>
                        {phases.map((ph) => (
                          <option key={ph.id} value={ph.id}>
                            {ph.name}
                          </option>
                        ))}
                      </select>
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
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  task.priority === 'High' ? 'bg-red-900/30 text-red-400' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {task.priority}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
