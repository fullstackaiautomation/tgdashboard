/**
 * FocusTimeMetric - Focus time percentage calculation and display
 *
 * Shows % of total available work hours that were tracked as Deep Work
 * Color-coded: >=70% green, 50-69% yellow, <50% red
 */

import { type FC } from 'react';
import { useFocusTimeMetric, type DateRange } from '@/hooks/useTimeAnalytics';

interface FocusTimeMetricProps {
  dateRange: DateRange;
  hoursPerDay?: number;
  workDaysPerWeek?: number;
}

export const FocusTimeMetric: FC<FocusTimeMetricProps> = ({
  dateRange,
  hoursPerDay = 8,
  workDaysPerWeek = 5,
}) => {
  const { data, isLoading } = useFocusTimeMetric(dateRange, hoursPerDay, workDaysPerWeek);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Focus Time</h3>
        <div className="animate-pulse h-32 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Focus Time</h3>
        <div className="text-center py-12 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const { tracked_hours, available_hours, focus_percentage } = data;

  // Determine color based on percentage
  const getColorClasses = (percentage: number) => {
    if (percentage >= 70) return {
      ring: 'ring-green-500',
      bg: 'bg-green-500',
      text: 'text-green-400',
      badge: 'bg-green-900/40 border-green-700 text-green-400',
    };
    if (percentage >= 50) return {
      ring: 'ring-yellow-500',
      bg: 'bg-yellow-500',
      text: 'text-yellow-400',
      badge: 'bg-yellow-900/40 border-yellow-700 text-yellow-400',
    };
    return {
      ring: 'ring-red-500',
      bg: 'bg-red-500',
      text: 'text-red-400',
      badge: 'bg-red-900/40 border-red-700 text-red-400',
    };
  };

  const colors = getColorClasses(focus_percentage);

  const getInsight = (percentage: number) => {
    if (percentage >= 70) return "Excellent! You're tracking most of your work hours.";
    if (percentage >= 50) return "Good tracking! Consider logging more sessions for better insights.";
    return "Low tracking rate. Log more deep work sessions to improve insights.";
  };

  // Calculate progress ring dimensions
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (focus_percentage / 100) * circumference;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-gray-100">Focus Time Metric</h3>

      <div className="flex flex-col items-center">
        {/* Progress Ring */}
        <div className="relative mb-6">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#374151"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${colors.text} transition-all duration-1000`}
            />
          </svg>

          {/* Percentage text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold ${colors.text}`}>
              {focus_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400 mt-1">Focus Time</div>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {tracked_hours.toFixed(1)}h
            </div>
            <div className="text-xs text-gray-400 mt-1">Tracked Hours</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-300">
              {available_hours.toFixed(0)}h
            </div>
            <div className="text-xs text-gray-400 mt-1">Available Hours</div>
          </div>
        </div>

        {/* Insight */}
        <div className={`w-full p-3 rounded-lg border ${colors.badge}`}>
          <div className="text-sm text-center">
            {getInsight(focus_percentage)}
          </div>
        </div>

        {/* Comparison text */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          You tracked {tracked_hours.toFixed(1)}h out of {available_hours.toFixed(0)}h available
          ({hoursPerDay}h/day, {workDaysPerWeek} days/week)
        </div>
      </div>
    </div>
  );
};
