// Story 5.1: Review Area Card Component
// Displays individual area summary with priority-based styling

import type { FC } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AreaSummary } from '../../hooks/useReviewDashboard';
import { ProgressBar } from '../shared/ProgressBar';

interface ReviewAreaCardProps {
  areaSummary: AreaSummary;
  icon: LucideIcon;
  color: string;
  route: string;
  displayName: string;
  onClick: () => void;
}

/**
 * ReviewAreaCard - Displays area summary with clickable navigation
 *
 * Implements Tasks 4, 7, 8 from Story 5.1:
 * - Color-coded icons and visual hierarchy
 * - Hover effects and keyboard navigation
 * - Priority-based borders and animations
 * - READ-ONLY enforcement (no edit buttons)
 * - Responsive design (mobile-friendly)
 */
export const ReviewAreaCard: FC<ReviewAreaCardProps> = ({
  areaSummary,
  icon: Icon,
  color,
  displayName,
  onClick,
}) => {
  // Border and background colors based on priority
  const borderColorClass = {
    critical: 'border-red-500',
    warning: 'border-yellow-500',
    normal: 'border-gray-700',
  }[areaSummary.priorityLevel];

  const bgColorClass = {
    critical: 'bg-red-950/20',
    warning: 'bg-yellow-950/20',
    normal: 'bg-gray-800',
  }[areaSummary.priorityLevel];

  // Icon colors
  const iconColorClass = `text-${color}-500`;

  // No pulse animation - removed per user request
  return (
    <div
      className={`${bgColorClass} rounded-lg p-6 border-2 ${borderColorClass}
                  hover:border-${color}-500 transition-all duration-300 cursor-pointer
                  transform hover:scale-105 hover:shadow-xl
                  focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${displayName} details. ${areaSummary.needsAttention ? 'Needs attention.' : ''}`}
    >
      {/* Header with Icon and Warning Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className={iconColorClass} size={32} strokeWidth={2} />
          <div>
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            {areaSummary.needsAttention && (
              <span className="text-xs text-orange-400 flex items-center gap-1 mt-1">
                <AlertTriangle size={12} />
                Needs Attention
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-white">
            {areaSummary.progressPercentage.toFixed(0)}%
          </span>
          <span className="text-sm text-gray-400">
            {areaSummary.completedTasks} / {areaSummary.totalTasks} tasks
          </span>
        </div>
        <ProgressBar progress={areaSummary.progressPercentage} size="lg" showLabel={false} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active Tasks</p>
          <p className="text-lg font-semibold text-white">{areaSummary.activeTasks}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Hours This Week</p>
          <p className="text-lg font-semibold text-white">{areaSummary.hoursThisWeek.toFixed(1)}h</p>
        </div>
      </div>

      {/* Overdue Warning */}
      {areaSummary.overdueTasks > 0 && (
        <div className="mb-4 p-2 bg-red-900/30 border border-red-500 rounded">
          <p className="text-sm text-red-300">
            {areaSummary.overdueTasks} overdue {areaSummary.overdueTasks === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      )}

      {/* Footer with Last Updated and View Details Link */}
      <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-3">
        <span className="text-gray-500 text-xs">{areaSummary.lastUpdatedFormatted}</span>
        <div className="flex items-center text-gray-400 hover:text-white transition-colors">
          <span className="text-xs font-medium">View Details</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};
