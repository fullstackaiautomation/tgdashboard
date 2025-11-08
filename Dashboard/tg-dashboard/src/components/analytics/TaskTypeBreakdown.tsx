/**
 * TaskTypeBreakdown - Horizontal bar chart showing time by task type
 *
 * Shows distribution of time across effort levels:
 * '$$$ Printer $$$', '$ Makes Money $', '-$ Save Dat $-', ':( No Money ):', '8) Vibing (8'
 */

import { type FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTaskTypeDistribution, type DateRange } from '@/hooks/useTimeAnalytics';

// Color scheme: revenue-generating types in green/gold, others in blue/gray
const TASK_TYPE_COLORS: Record<string, string> = {
  '$$$ Printer $$$': '#10b981',    // Green (money-making)
  '$ Makes Money $': '#34d399',    // Light green (money-making)
  '-$ Save Dat $-': '#3b82f6',     // Blue (cost-saving)
  ':( No Money ):': '#6b7280',     // Gray (no revenue)
  '8) Vibing (8': '#8b5cf6',       // Purple (leisure)
};

interface TaskTypeBreakdownProps {
  dateRange: DateRange;
}

export const TaskTypeBreakdown: FC<TaskTypeBreakdownProps> = ({ dateRange }) => {
  const { data, isLoading } = useTaskTypeDistribution(dateRange);

  const chartData = data?.map(item => ({
    name: item.task_type,
    hours: item.hours,
    percentage: item.percentage,
    sessions: item.session_count,
    color: TASK_TYPE_COLORS[item.task_type] || '#6b7280',
  })) || [];

  // Calculate revenue-generating percentage
  const revenuePercentage = data
    ?.filter(item => item.task_type.includes('$$$') || item.task_type.includes('$ Makes'))
    .reduce((sum, item) => sum + item.percentage, 0) || 0;

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Task Type Breakdown</h3>
        <div className="animate-pulse h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Task Type Breakdown</h3>
        <div className="text-center py-12 text-gray-400">
          No data available for selected date range
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Task Type Breakdown</h3>
        <div className="text-sm text-gray-400">By Effort Level</div>
      </div>

      {/* Insight */}
      {revenuePercentage > 0 && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
          <div className="text-sm text-green-400">
            💰 You spent <span className="font-bold">{revenuePercentage.toFixed(1)}%</span> of time on revenue-generating work
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            stroke="#9ca3af"
            label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9ca3af"
            width={140}
            tick={{ fill: '#d1d5db' }}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}h (${props.payload.percentage}%)`,
              `${props.payload.sessions} sessions`
            ]}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
            }}
          />
          <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend with percentages */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chartData.map(item => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-gray-300">
              {item.name}: <span className="font-semibold">{item.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
