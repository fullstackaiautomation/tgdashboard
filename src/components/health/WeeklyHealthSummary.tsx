import { type FC } from 'react';
import { TrendingUp, TrendingDown, Check, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { useWeeklyHealthSummary } from '@/hooks/useHealthTimeMonitoring';

/**
 * WeeklyHealthSummary - End-of-week health time retrospective
 *
 * Features:
 * - Week-over-week comparison
 * - Percentage change indicator
 * - Line chart showing 4-week trend
 * - Table showing last 4 weeks with target achievement
 * - Insights based on trend
 */
export const WeeklyHealthSummary: FC = () => {
  const { data: summary, isLoading } = useWeeklyHealthSummary(4);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Weekly Health Summary</h3>
        <p className="text-gray-400 text-center py-8">No health time data available yet</p>
      </div>
    );
  }

  // Get current and last week data
  const thisWeek = summary[0];
  const lastWeek = summary.length > 1 ? summary[1] : null;

  const weeklyDelta = lastWeek ? thisWeek.hours - lastWeek.hours : 0;
  const weeklyDeltaPercentage = lastWeek && lastWeek.hours > 0
    ? ((thisWeek.hours - lastWeek.hours) / lastWeek.hours) * 100
    : 0;

  const TrendIcon = weeklyDelta >= 0 ? TrendingUp : TrendingDown;
  const trendColor = weeklyDelta >= 0 ? 'text-green-400' : 'text-red-400';

  // Determine trend insight
  const getTrendInsight = () => {
    const metCount = summary.filter(w => w.met_target).length;

    if (metCount === 4) {
      return {
        type: 'success',
        message: '🎉 Perfect consistency! You met your health target all 4 weeks.'
      };
    } else if (metCount >= 2) {
      return {
        type: 'good',
        message: `✓ Good effort! You met your target ${metCount} out of 4 weeks.`
      };
    } else if (weeklyDelta > 0) {
      return {
        type: 'improving',
        message: '↗ Trending upward! Keep building this positive momentum.'
      };
    } else {
      return {
        type: 'warning',
        message: '⚠ Your health time is trending down - consider blocking calendar time.'
      };
    }
  };

  const insight = getTrendInsight();

  // Prepare chart data (reverse to show chronological order)
  const chartData = [...summary].reverse().map(week => ({
    week: format(parseISO(week.week_start), 'MMM d'),
    hours: week.hours,
    target: week.target_hours,
  }));

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-gray-100 mb-6">Weekly Health Summary</h3>

      {/* Current Week Highlight */}
      <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">This Week</span>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-teal-400">
              {thisWeek.hours.toFixed(1)}h
            </div>
            {lastWeek && (
              <div className="text-sm text-gray-400">
                from {lastWeek.hours.toFixed(1)}h
              </div>
            )}
          </div>
        </div>

        {lastWeek && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
              <span className={`text-sm font-medium ${trendColor}`}>
                {weeklyDelta >= 0 ? '+' : ''}{weeklyDelta.toFixed(1)}h
                {' '}({weeklyDelta >= 0 ? '+' : ''}{weeklyDeltaPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className={`text-sm ${thisWeek.met_target ? 'text-green-400' : 'text-red-400'}`}>
              {thisWeek.met_target ? '✓ Met target' : '✗ Below target'}
            </div>
          </div>
        )}
      </div>

      {/* Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">4-Week Trend</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="week"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#14b8a6"
              strokeWidth={3}
              dot={{ fill: '#14b8a6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Comparison Table */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Last 4 Weeks</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400 font-medium">Week</th>
                <th className="text-right py-2 text-gray-400 font-medium">Hours</th>
                <th className="text-right py-2 text-gray-400 font-medium">Target</th>
                <th className="text-right py-2 text-gray-400 font-medium">%</th>
                <th className="text-center py-2 text-gray-400 font-medium">Met</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((week, index) => (
                <tr
                  key={week.week_start}
                  className={`border-b border-gray-700/50 ${index === 0 ? 'bg-gray-700/30' : ''}`}
                >
                  <td className="py-2 text-gray-300">
                    {index === 0 ? 'This Week' : `${index} ${index === 1 ? 'week' : 'weeks'} ago`}
                  </td>
                  <td className="text-right py-2 font-medium text-gray-100">
                    {week.hours.toFixed(1)}h
                  </td>
                  <td className="text-right py-2 text-gray-400">
                    {week.target_hours}h
                  </td>
                  <td className={`text-right py-2 font-medium ${
                    week.percentage >= 100 ? 'text-green-400' :
                    week.percentage >= 80 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {week.percentage}%
                  </td>
                  <td className="text-center py-2">
                    {week.met_target ? (
                      <Check className="w-5 h-5 text-green-400 inline" />
                    ) : (
                      <X className="w-5 h-5 text-red-400 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insight */}
      <div className={`rounded p-3 text-sm ${
        insight.type === 'success' ? 'bg-green-900/20 text-green-400' :
        insight.type === 'good' ? 'bg-blue-900/20 text-blue-400' :
        insight.type === 'improving' ? 'bg-teal-900/20 text-teal-400' :
        'bg-yellow-900/20 text-yellow-400'
      }`}>
        {insight.message}
      </div>
    </div>
  );
};
