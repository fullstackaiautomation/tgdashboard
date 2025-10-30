import { type FC } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useHealthTimeStats } from '@/hooks/useHealthTimeMonitoring';

/**
 * HealthTimeAllocationCard - Displays health time allocation with weekly and daily progress
 *
 * Features:
 * - Weekly progress: actual vs target with percentage and color coding
 * - Daily progress: today's hours vs daily target
 * - Trend indicator: week-over-week comparison
 * - Warning badge when below 80% of target
 * - Progress bar with green (>=100%), yellow (80-99%), red (<80%)
 */
export const HealthTimeAllocationCard: FC = () => {
  const { data: stats, isLoading } = useHealthTimeStats();

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Health Time Allocation</h3>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const weeklyColor =
    stats.weekly_percentage >= 100 ? 'text-green-400' :
    stats.weekly_percentage >= 80 ? 'text-yellow-400' :
    'text-red-400';

  const weeklyBarColor =
    stats.weekly_percentage >= 100 ? 'bg-green-500' :
    stats.weekly_percentage >= 80 ? 'bg-yellow-500' :
    'bg-red-500';

  const TrendIcon = stats.weekly_delta >= 0 ? TrendingUp : TrendingDown;
  const trendColor = stats.weekly_delta >= 0 ? 'text-green-400' : 'text-red-400';
  const showWarning = stats.weekly_percentage < 80;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-gray-100 mb-6">Health Time Allocation</h3>

      {/* Weekly Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm text-gray-400">This Week</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${weeklyColor}`}>
              {stats.hours_this_week.toFixed(1)}h
            </span>
            <span className="text-gray-400">/ {stats.target_weekly_hours}h</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${weeklyBarColor}`}
            style={{ width: `${Math.min(stats.weekly_percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Percentage */}
          <span className={`text-sm font-medium ${weeklyColor}`}>
            {stats.weekly_percentage}% of target
          </span>

          {/* Trend */}
          <div className="flex items-center text-sm">
            <TrendIcon className={`w-4 h-4 mr-1 ${trendColor}`} />
            <span className={trendColor}>
              {stats.weekly_delta >= 0 ? '+' : ''}{stats.weekly_delta.toFixed(1)}h vs last week
            </span>
          </div>
        </div>

        {/* Warning Badge */}
        {showWarning && (
          <div className="flex items-center mt-3 bg-yellow-900/30 border border-yellow-600 rounded p-3">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="text-sm text-yellow-400">
              <span className="font-semibold">{stats.hours_below_target.toFixed(1)}h below target</span>
              {' '}- Consider scheduling health time this week
            </span>
          </div>
        )}
      </div>

      {/* Daily Progress */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Today</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold text-gray-100">
              {stats.hours_today.toFixed(1)}h
            </span>
            <span className="text-gray-500">/ {stats.target_daily_hours.toFixed(1)}h</span>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-teal-500 transition-all duration-500"
            style={{ width: `${Math.min(stats.daily_percentage, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Target: {(stats.target_daily_hours * 60).toFixed(0)} minutes per day
        </p>
      </div>
    </div>
  );
};
