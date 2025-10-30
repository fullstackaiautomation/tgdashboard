import type { FC } from 'react';
import { X } from 'lucide-react';
import type { TaskHub } from '../../types/task';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { format } from 'date-fns';
import { parseLocalDate } from '../../utils/dateHelpers';

interface PhaseTasksListProps {
  tasks: TaskHub[];
  phaseName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PhaseTasksList - Modal showing all tasks in a phase with individual progress
 * Accessed by clicking the progress bar on a PhaseCard
 */
export const PhaseTasksList: FC<PhaseTasksListProps> = ({
  tasks,
  phaseName,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by progress (incomplete first, then by progress %)
    const progressA = a.progress_percentage ?? 0;
    const progressB = b.progress_percentage ?? 0;

    if (progressA === 100 && progressB !== 100) return 1;
    if (progressA !== 100 && progressB === 100) return -1;

    return progressA - progressB;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <div>
              <h3 className="text-xl font-semibold text-gray-100">{phaseName}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tasks List */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No tasks in this phase</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTasks.map((task) => {
                  // Check if task is overdue using timezone-safe comparison
                  let isOverdue = false;
                  if (task.due_date && (task.progress_percentage ?? 0) < 100) {
                    const dueDate = parseLocalDate(task.due_date);
                    if (dueDate) {
                      const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0);
                      const todayMidnight = new Date();
                      todayMidnight.setHours(0, 0, 0, 0);
                      isOverdue = dueDateMidnight.getTime() < todayMidnight.getTime();
                    }
                  }

                  return (
                    <div
                      key={task.id}
                      className={`bg-gray-800 rounded-lg p-4 border ${
                        isOverdue ? 'border-red-500/50' : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Progress Indicator */}
                        <div className="pt-1">
                          <ProgressIndicator
                            progress={task.progress_percentage ?? 0}
                            size="md"
                          />
                        </div>

                        {/* Task Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4
                                className={`font-medium ${
                                  (task.progress_percentage ?? 0) === 100
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-100'
                                }`}
                              >
                                {task.task_name}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-400 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Progress Percentage */}
                            <div className="text-right">
                              <span
                                className={`text-sm font-semibold ${
                                  (task.progress_percentage ?? 0) < 33
                                    ? 'text-red-400'
                                    : (task.progress_percentage ?? 0) < 67
                                    ? 'text-yellow-400'
                                    : 'text-green-400'
                                }`}
                              >
                                {task.progress_percentage ?? 0}%
                              </span>
                            </div>
                          </div>

                          {/* Metadata Row */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            {/* Status Badge */}
                            <span
                              className={`px-2 py-1 rounded ${
                                task.status === 'Done'
                                  ? 'bg-green-600/20 text-green-400'
                                  : task.status === 'In progress'
                                  ? 'bg-yellow-600/20 text-yellow-400'
                                  : 'bg-gray-700 text-gray-400'
                              }`}
                            >
                              {task.status}
                            </span>

                            {/* Due Date */}
                            {task.due_date && (() => {
                              const dueDate = parseLocalDate(task.due_date);
                              return dueDate ? (
                                <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                                  Due: {format(dueDate, 'MMM d, yyyy')}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              ) : null;
                            })()}

                            {/* Area */}
                            {task.area && (
                              <span className="text-gray-500">
                                {task.area}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
