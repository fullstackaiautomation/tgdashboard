// Story 5.2: Daily Area Card Component
// Enhanced card with circular progress, time tracking, and quick actions

import type { FC } from 'react';
import { Calendar, Clock, AlertTriangle, ChevronRight, Target, Zap } from 'lucide-react';
import { useDailyAreaSummary } from '../../hooks/useDailyAreaSummary';

interface DailyAreaCardProps {
  onClick: () => void;
}

/**
 * DailyAreaCard - Enhanced daily summary card with rich metrics
 *
 * Implements Tasks 3-9 from Story 5.2:
 * - Circular progress ring with adaptive colors
 * - Tasks due today/tomorrow/overdue counts
 * - Deep Work hours vs target
 * - Last session and next scheduled item
 * - "Plan Today" quick action button
 * - Time-of-day progress tracking
 */
export const DailyAreaCard: FC<DailyAreaCardProps> = ({ onClick }) => {
  const { data: summary, isLoading } = useDailyAreaSummary();

  if (isLoading || !summary) {
    // Skeleton loading state
    return (
      <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-700 rounded" />
          <div className="h-6 w-32 bg-gray-700 rounded" />
        </div>
        <div className="h-24 w-24 bg-gray-700 rounded-full mx-auto mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-700 rounded" />
          <div className="h-4 w-3/4 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // Determine border and background color based on progress status
  const borderColor = {
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    red: 'border-red-500',
  }[summary.progressResult.color];

  const bgColor = {
    green: 'bg-green-950/20',
    yellow: 'bg-yellow-950/20',
    red: 'bg-red-950/20',
  }[summary.progressResult.color];

  // Progress ring color
  const ringColor = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
  }[summary.progressResult.color];

  // Calculate ring circumference (for SVG circle progress)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = summary.dailyCompletionPercentage;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`${bgColor} rounded-lg p-6 border-2 ${borderColor}
                  hover:border-blue-500 transition-all duration-300 cursor-pointer
                  transform hover:scale-105 hover:shadow-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="View Daily details"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="text-blue-500" size={32} strokeWidth={2} />
          <div>
            <h3 className="text-xl font-bold text-white">Daily</h3>
            <p className="text-xs text-gray-400">{summary.progressResult.message}</p>
          </div>
        </div>
      </div>

      {/* Circular Progress Ring */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#374151"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={ringColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {progress.toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">complete</span>
          </div>
        </div>
      </div>

      {/* Tasks Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-blue-400" />
            <span className="text-xs text-gray-500 uppercase">Due Today</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {summary.tasksCompletedToday} / {summary.tasksDueToday}
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-purple-400" />
            <span className="text-xs text-gray-500 uppercase">Deep Work</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {summary.deepWorkHoursToday.toFixed(1)}h / {summary.deepWorkTargetHours}h
          </p>
        </div>
      </div>

      {/* Overdue Warning */}
      {summary.tasksOverdue > 0 && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-500 rounded flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <p className="text-sm text-red-300">
            {summary.tasksOverdue} overdue {summary.tasksOverdue === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      )}

      {/* Last Deep Work Session */}
      {summary.lastSessionArea && summary.lastSessionDuration && (
        <div className="mb-3 p-2 bg-purple-950/30 border border-purple-700 rounded">
          <p className="text-xs text-purple-300">
            Last session: {summary.lastSessionDuration.toFixed(1)}h on {summary.lastSessionArea}
            {summary.lastSessionTimeAgo && ` (${summary.lastSessionTimeAgo})`}
          </p>
        </div>
      )}

      {/* Next Scheduled Item */}
      {summary.nextScheduledTask && summary.nextScheduledTimeFormatted && (
        <div className="mb-3 p-2 bg-blue-950/30 border border-blue-700 rounded flex items-center gap-2">
          <Clock size={14} className="text-blue-400" />
          <p className="text-xs text-blue-300">
            Next: {summary.nextScheduledTask} at {summary.nextScheduledTimeFormatted}
          </p>
        </div>
      )}

      {/* Due Tomorrow Preview */}
      {summary.tasksDueTomorrow > 0 && (
        <div className="mb-3 text-xs text-gray-400">
          📅 {summary.tasksDueTomorrow} {summary.tasksDueTomorrow === 1 ? 'task' : 'tasks'} due tomorrow
        </div>
      )}

      {/* Footer with Plan Today Button */}
      <div className="flex items-center justify-between border-t border-gray-700 pt-3">
        <div className="flex items-center text-gray-400 hover:text-white transition-colors">
          <span className="text-xs font-medium">Plan Today</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};
