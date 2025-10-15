/**
 * DueTodayCard - Shows tasks due today with completion progress
 * Story 2.5: Daily Goals Progress Tracking (Task 3)
 */

import type { FC } from 'react';
import { format } from 'date-fns';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { useTasks } from '@/hooks/useTasks';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface DueTodayCardProps {
  date?: Date;
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

/**
 * DueTodayCard - Card showing tasks due today with progress
 * Displays completion stats, progress bar, and list of tasks with checkboxes
 *
 * @param date - Date to show tasks for (defaults to today)
 * @param onTaskClick - Callback when task is clicked
 */
export const DueTodayCard: FC<DueTodayCardProps> = ({
  date = new Date(),
  onTaskClick,
  className = '',
}) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const { data: dailyProgress, isLoading: progressLoading } = useDailyProgress(date);
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks();

  // Filter tasks due today
  const tasksToday = allTasks.filter(t => t.due_date === dateString);

  // Separate overdue tasks that are also due today (edge case)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const overdueTasksToday = tasksToday.filter(t =>
    t.due_date && new Date(t.due_date) < today && t.progress_percentage < 100
  );

  const isLoading = progressLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const progress = dailyProgress?.dailyProgress ?? 0;
  const completedCount = dailyProgress?.completedCount ?? 0;
  const totalCount = dailyProgress?.totalCount ?? 0;

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Due Today</h3>

        {/* Progress Summary */}
        {totalCount > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                {completedCount} of {totalCount} tasks complete
              </span>
              <span className={`text-sm font-semibold ${
                progress < 33 ? 'text-red-400' :
                progress < 67 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {progress.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <ProgressBar progress={progress} size="sm" showLabel={false} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tasks due today</p>
        )}
      </div>

      {/* Task List */}
      {tasksToday.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasksToday.map((task) => {
            const isOverdue = overdueTasksToday.some(t => t.id === task.id);
            const isCompleted = task.progress_percentage === 100;

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isOverdue
                    ? 'border-red-500 bg-red-950/20 hover:bg-red-950/30'
                    : 'border-gray-700 bg-gray-900 hover:bg-gray-850'
                } ${onTaskClick ? 'cursor-pointer' : ''}`}
                onClick={() => onTaskClick?.(task.id)}
              >
                {/* Checkbox Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : (
                    <Circle className="text-gray-500" size={20} />
                  )}
                </div>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-medium ${
                      isCompleted ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.task_name}
                    </span>

                    {/* Overdue Indicator */}
                    {isOverdue && (
                      <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                    )}
                  </div>

                  {/* Task Details */}
                  {task.area && (
                    <span className="text-xs text-gray-500">
                      {task.area}
                    </span>
                  )}

                  {/* Progress if not 0 or 100 */}
                  {task.progress_percentage > 0 && task.progress_percentage < 100 && (
                    <div className="mt-1">
                      <ProgressBar
                        progress={task.progress_percentage}
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
