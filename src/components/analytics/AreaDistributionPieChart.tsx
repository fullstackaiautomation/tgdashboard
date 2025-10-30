/**
 * AreaDistributionPieChart - Pie chart showing % of time spent on each area
 *
 * Uses Recharts PieChart to display area distribution with percentages
 */

import { type FC } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAreaDistribution, type DateRange } from '@/hooks/useTimeAnalytics';

// Predefined colors for 7 life areas
const AREA_COLORS: Record<string, string> = {
  'Full Stack': '#3b82f6',    // Blue
  'S4': '#8b5cf6',            // Purple
  '808': '#ec4899',           // Pink
  'Personal': '#f59e0b',      // Amber
  'Huge Capital': '#10b981',  // Green
  'Golf': '#06b6d4',          // Cyan
  'Health': '#ef4444',        // Red
};

interface AreaDistributionPieChartProps {
  dateRange: DateRange;
}

export const AreaDistributionPieChart: FC<AreaDistributionPieChartProps> = ({ dateRange }) => {
  const { data, isLoading } = useAreaDistribution(dateRange);

  const totalHours = data?.reduce((sum, item) => sum + item.hours, 0) || 0;

  const chartData = data?.map(item => ({
    name: item.area,
    value: item.hours,
    color: AREA_COLORS[item.area] || '#6b7280',
    percentage: item.percentage,
  })) || [];

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Area Distribution</h3>
        <div className="animate-pulse h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Area Distribution</h3>
        <div className="text-center py-12 text-gray-400">
          No data available for selected date range
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-100">Area Distribution</h3>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `${value.toFixed(1)}h`}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
            }}
          />
          <Legend
            wrapperStyle={{ color: '#d1d5db' }}
            formatter={(value, entry: any) => {
              const data = entry.payload;
              return `${value} (${data.percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total hours display */}
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold text-orange-400">{totalHours.toFixed(1)}h</div>
        <div className="text-sm text-gray-400">Total Hours Tracked</div>
      </div>
    </div>
  );
};
