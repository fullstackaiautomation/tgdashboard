// Story 5.6: Needs Attention Section - Minimal Implementation
// Displays overdue tasks only (no dismissal, no weekly summary, no smart recommendations)

import type { FC } from 'react';
import { AlertTriangle, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';
import { useOverdueTasks } from '../../hooks/useOverdueTasks';
import { formatDistanceToNow } from 'date-fns';

interface NeedsAttentionSectionProps {
  onNavigate: (tab: 'review' | 'tasks' | 'dailytime' | 'business' | 'content' | 'health' | 'finance' | 'notes' | 'analytics' | 'planning' | 'calendar' | 'insights') => void;
}

/**
 * NeedsAttentionSection - Shows overdue tasks across all areas
 *
 * Minimal implementation:
 * - Displays count and list of overdue tasks
 * - Click to navigate to Tasks Hub
 * - "All Clear" state when no overdue tasks
 * - NO dismissal system, weekly summaries, or smart recommendations
 */
export const NeedsAttentionSection: FC<NeedsAttentionSectionProps> = ({ onNavigate }) => {
  const { data: overdueTasks = [], isLoading } = useOverdueTasks();

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Checking for issues...</span>
        </div>
      </div>
    );
  }

  const overdueCount = overdueTasks.length;

  // All Clear state
  if (overdueCount === 0) {
    return (
      <div className="bg-green-950/20 rounded-lg p-6 border-2 border-green-700 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-green-500" size={32} />
          <div>
            <h3 className="text-xl font-bold text-green-400">All Clear</h3>
            <p className="text-sm text-green-300">No overdue tasks. You're on track!</p>
          </div>
        </div>
      </div>
    );
  }

  // Overdue tasks state
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const sortedTasks = [...overdueTasks].sort((a, b) => {
    // Sort by priority first, then by days overdue
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.days_overdue - a.days_overdue;
  });

  const criticalCount = overdueTasks.filter(t => t.priority === 'High').length;
  const warningCount = overdueTasks.filter(t => t.priority === 'Medium').length;

  return (
    <div className="bg-red-950/20 rounded-lg p-6 border-2 border-red-500 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={32} />
          <div>
            <h3 className="text-xl font-bold text-red-400">Needs Attention</h3>
            <p className="text-sm text-red-300">
              {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
              {criticalCount > 0 && ` · ${criticalCount} critical`}
              {warningCount > 0 && ` · ${warningCount} important`}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('tasks')}
          className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          View All Tasks
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Overdue Tasks List (showing up to 5) */}
      <div className="space-y-2">
        {sortedTasks.slice(0, 5).map((task) => {
          const priorityColor = {
            High: 'text-red-400',
            Medium: 'text-yellow-400',
            Low: 'text-gray-400',
          }[task.priority];

          const priorityBg = {
            High: 'bg-red-900/30',
            Medium: 'bg-yellow-900/30',
            Low: 'bg-gray-800',
          }[task.priority];

          return (
            <div
              key={task.task_id}
              className={`${priorityBg} rounded p-3 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer`}
              onClick={() => onNavigate('tasks')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${priorityColor}`}>{task.task_name}</span>
                    <span className="text-xs text-gray-500 uppercase">{task.priority}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {task.days_overdue} {task.days_overdue === 1 ? 'day' : 'days'} overdue
                    </span>
                    {task.business_name && (
                      <span className="text-gray-500">
                        {task.business_name}
                        {task.project_name && ` · ${task.project_name}`}
                      </span>
                    )}
                    {!task.business_name && task.area && (
                      <span className="text-gray-500">{task.area}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 mt-1" />
              </div>
            </div>
          );
        })}

        {/* Show "and X more" if there are additional tasks */}
        {overdueCount > 5 && (
          <button
            onClick={() => onNavigate('tasks')}
            className="w-full text-center text-sm text-red-400 hover:text-red-300 py-2 transition-colors"
          >
            and {overdueCount - 5} more overdue {overdueCount - 5 === 1 ? 'task' : 'tasks'}
          </button>
        )}
      </div>
    </div>
  );
};
