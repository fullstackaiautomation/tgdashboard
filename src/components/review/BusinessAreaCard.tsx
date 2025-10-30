// Story 5.3: Business Area Card (Simplified)
// Shows aggregate business metrics without expansion

import type { FC } from 'react';
import { Briefcase, Target, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { useBusinessAreaSummary } from '../../hooks/useBusinessAreaSummary';
import { ProgressBar } from '../shared/ProgressBar';

interface BusinessAreaCardProps {
  onClick: () => void;
}

export const BusinessAreaCard: FC<BusinessAreaCardProps> = ({ onClick }) => {
  const { data: summary, isLoading } = useBusinessAreaSummary();

  if (isLoading || !summary) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-700 rounded" />
          <div className="h-6 w-32 bg-gray-700 rounded" />
        </div>
        <div className="h-20 bg-gray-700 rounded mb-4" />
      </div>
    );
  }

  const needsAttention = summary.overdueTasks > 0 || summary.overallCompletionPercentage < 40;
  const borderColor = needsAttention ? 'border-yellow-500' : 'border-purple-700';
  const bgColor = needsAttention ? 'bg-yellow-950/20' : 'bg-gray-800';

  return (
    <div
      className={`${bgColor} rounded-lg p-6 border-2 ${borderColor}
                  hover:border-purple-500 transition-all duration-300 cursor-pointer
                  transform hover:scale-105 hover:shadow-xl
                  focus:outline-none focus:ring-2 focus:ring-purple-500`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="View Business Projects details"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Briefcase className="text-purple-500" size={32} strokeWidth={2} />
          <div>
            <h3 className="text-xl font-bold text-white">Business Projects</h3>
            <p className="text-xs text-gray-400">All businesses aggregate</p>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-white">
            {summary.overallCompletionPercentage.toFixed(0)}%
          </span>
          <span className="text-sm text-gray-400">
            {summary.completedTasks} / {summary.totalTasks} tasks
          </span>
        </div>
        <ProgressBar progress={summary.overallCompletionPercentage} size="lg" showLabel={false} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-purple-400" />
            <span className="text-xs text-gray-500 uppercase">Active</span>
          </div>
          <p className="text-lg font-semibold text-white">{summary.activeTasks}</p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-blue-400" />
            <span className="text-xs text-gray-500 uppercase">This Week</span>
          </div>
          <p className="text-lg font-semibold text-white">{summary.hoursThisWeek.toFixed(1)}h</p>
        </div>
      </div>

      {/* Overdue Warning */}
      {summary.overdueTasks > 0 && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-500 rounded flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <p className="text-sm text-red-300">
            {summary.overdueTasks} overdue {summary.overdueTasks === 1 ? 'task' : 'tasks'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700 pt-3">
        <div className="flex items-center text-gray-400 hover:text-white transition-colors">
          <span className="text-xs font-medium">View All Businesses</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};
