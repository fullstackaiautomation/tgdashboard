import { type FC, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useHealthActivityBreakdown } from '@/hooks/useHealthTimeMonitoring';

// Color mapping for common health activities
const ACTIVITY_COLORS: Record<string, string> = {
  'Workout': '#ef4444',        // red-500
  'Cardio': '#dc2626',         // red-600
  'Strength': '#f87171',       // red-400
  'Yoga': '#a855f7',           // purple-500
  'Meditation': '#8b5cf6',     // violet-500
  'Meal Prep': '#10b981',      // emerald-500
  'Meal Planning': '#059669',  // emerald-600
  'Physio': '#f59e0b',         // amber-500
  'Health Research': '#3b82f6', // blue-500
  'Doctor': '#06b6d4',         // cyan-500
  'Mental Health': '#ec4899',  // pink-500
};

const DEFAULT_COLOR = '#6b7280'; // gray-500

type DateRangeOption = 'week' | 'month' | 'quarter';

/**
 * HealthTimeBreakdown - Activity breakdown by labels
 *
 * Features:
 * - Horizontal bar chart showing hours per activity
 * - Color-coded activities (workout=red, meal prep=green, meditation=purple)
 * - Percentage of total health time per activity
 * - Filter by date range (This Week, This Month, Last 3 Months)
 * - Empty state when no labeled sessions
 */
export const HealthTimeBreakdown: FC = () => {
  const [dateRange, setDateRange] = useState<DateRangeOption>('week');

  const daysMap: Record<DateRangeOption, number> = {
    week: 7,
    month: 30,
    quarter: 90,
  };

  const { data: activities, isLoading } = useHealthActivityBreakdown(daysMap[dateRange]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Health Activity Breakdown</h3>
        <p className="text-gray-400 text-center py-8">
          No labeled health activities for this period.
          <br />
          <span className="text-sm">Add labels to your deep work sessions to see activity breakdown</span>
        </p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = activities.map(activity => ({
    ...activity,
    color: ACTIVITY_COLORS[activity.activity] || DEFAULT_COLOR,
  }));

  const totalHours = activities.reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header with date range filter */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-100">Health Activity Breakdown</h3>

        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              dateRange === 'week'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              dateRange === 'month'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateRange('quarter')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              dateRange === 'quarter'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            type="category"
            dataKey="activity"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)} hours (${props.payload.percentage.toFixed(1)}%)`,
              'Time'
            ]}
          />
          <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700/50 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Total Activities</div>
          <div className="text-xl font-bold text-gray-100">{activities.length}</div>
        </div>
        <div className="bg-gray-700/50 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Total Hours</div>
          <div className="text-xl font-bold text-teal-400">{totalHours.toFixed(1)}h</div>
        </div>
        <div className="bg-gray-700/50 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Total Sessions</div>
          <div className="text-xl font-bold text-gray-100">
            {activities.reduce((sum, a) => sum + a.session_count, 0)}
          </div>
        </div>
        <div className="bg-gray-700/50 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Top Activity</div>
          <div className="text-sm font-semibold text-gray-100 truncate">
            {activities[0]?.activity || 'N/A'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Activity Colors:</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ACTIVITY_COLORS).map(([activity, color]) => (
            <div key={activity} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-400">{activity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
