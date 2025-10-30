/**
 * LabelTimeAnalysis - Horizontal bar chart of time spent by label
 *
 * Shows top labels by hours, with color-coding for revenue-generating labels
 * Provides insights on time allocation patterns
 */

import { type FC, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLabelAnalysis, type DateRange } from '@/hooks/useTimeAnalytics';

interface LabelTimeAnalysisProps {
  dateRange: DateRange;
  topN?: number;
}

export const LabelTimeAnalysis: FC<LabelTimeAnalysisProps> = ({ dateRange, topN = 10 }) => {
  const { data, isLoading } = useLabelAnalysis(dateRange);
  const [showAll, setShowAll] = useState(false);

  // Determine label color based on content
  const getLabelColor = (label: string): string => {
    if (label.includes('$$$')) return '#10b981'; // Green for revenue
    if (label.toLowerCase().includes('meeting')) return '#6b7280'; // Gray for meetings
    if (label.toLowerCase().includes('internal')) return '#3b82f6'; // Blue for internal
    return '#8b5cf6'; // Purple for others
  };

  const displayData = showAll ? data : data?.slice(0, topN);

  const chartData = displayData?.map(item => ({
    label: item.label,
    hours: item.total_hours,
    percentage: item.percentage,
    sessions: item.session_count,
    color: getLabelColor(item.label),
  })) || [];

  // Calculate revenue label percentage
  const revenuePercentage = data
    ?.filter(item => item.label.includes('$$$'))
    .reduce((sum, item) => sum + item.percentage, 0) || 0;

  const meetingPercentage = data
    ?.filter(item => item.label.toLowerCase().includes('meeting'))
    .reduce((sum, item) => sum + item.percentage, 0) || 0;

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Label Time Analysis</h3>
        <div className="animate-pulse h-80 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Label Time Analysis</h3>
        <div className="text-center py-12 text-gray-400">
          No labeled sessions found for selected date range
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Label Time Analysis</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showAll ? 'Show Top 10' : `Show All (${data.length})`}
        </button>
      </div>

      {/* Insights */}
      <div className="mb-4 space-y-2">
        {revenuePercentage > 0 && (
          <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="text-sm text-green-400">
              💰 You spent <span className="font-bold">{revenuePercentage.toFixed(1)}%</span> of time on revenue-generating work ($$$)
            </div>
          </div>
        )}
        {meetingPercentage > 15 && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div className="text-sm text-yellow-400">
              ⚠️ Meetings account for <span className="font-bold">{meetingPercentage.toFixed(1)}%</span> of time - consider reducing to focus on high-value work
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            stroke="#9ca3af"
            tick={{ fill: '#d1d5db' }}
            label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#9ca3af"
            width={140}
            tick={{ fill: '#d1d5db', fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}h (${props.payload.percentage}%) - ${props.payload.sessions} sessions`,
              'Time Spent'
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

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-300">Revenue ($$$)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-300">Internal Work</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500"></div>
          <span className="text-gray-300">Meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span className="text-gray-300">Other</span>
        </div>
      </div>
    </div>
  );
};
