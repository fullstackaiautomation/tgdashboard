import type { FC } from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { useUpdateTask } from '../../hooks/useTasks';
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
  if (!task.due_date || task.status === 'Done') return false;
  return new Date(task.due_date) < new Date();
};

/**
 * TaskCard - Displays a single task with business/area color coding and inline editing
 */
export const TaskCard: FC<TaskCardProps> = ({ task, className = '' }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.task_name);
  const updateTask = useUpdateTask();

  const colorClass = getColorClass(task);
  const sourceName = getSourceName(task);
  const overdue = isOverdue(task);

  const handleStatusToggle = () => {
    const newStatus: TaskStatus = task.status === 'Done' ? 'Not started' : 'Done';
    updateTask.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        completed_at: newStatus === 'Done' ? new Date().toISOString() : undefined,
      },
    });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask.mutate({
      id: task.id,
      updates: {
        status: newStatus,
        completed_at: newStatus === 'Done' ? new Date().toISOString() : undefined,
      },
    });
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.task_name) {
      updateTask.mutate({
        id: task.id,
        updates: { task_name: editedTitle.trim() },
      });
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

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined;
    updateTask.mutate({
      id: task.id,
      updates: { due_date: newDate },
    });
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors ${className}`}>
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
                onKeyDown={handleTitleKeyDown}
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

              {/* Status Badges */}
              {overdue && (
                <span className="px-2 py-1 text-xs font-medium bg-red-900/30 text-red-400 rounded border border-red-500/50">
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-gray-400 text-sm mb-3">{task.description}</p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Business/Area Badge */}
            <span className={`px-2 py-1 text-xs font-medium text-white rounded ${colorClass}`}>
              {sourceName}
            </span>

            {/* Project > Phase Hierarchy */}
            {task.projects && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className="font-medium">{task.projects.name}</span>
                {task.phases && (
                  <>
                    <span>›</span>
                    <span>{task.phases.name}</span>
                  </>
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
