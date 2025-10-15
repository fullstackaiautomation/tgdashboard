/**
 * PeakProductivityChart - Time-of-day productivity analysis
 *
 * Shows bar chart of hours worked by time bucket (Morning/Afternoon/Evening/Night)
 * Identifies peak productivity hours with insights
 */

import { type FC, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usePeakProductivity, type DateRange } from '@/hooks/useTimeAnalytics';

interface TimeBucket {
  name: string;
  start: number;
  end: number;
  emoji: string;
}

const TIME_BUCKETS: TimeBucket[] = [
  { name: 'Morning', start: 6, end: 11, emoji: '🌅' },
  { name: 'Afternoon', start: 12, end: 17, emoji: '☀️' },
  { name: 'Evening', start: 18, end: 23, emoji: '🌆' },
  { name: 'Night', start: 0, end: 5, emoji: '🌙' },
];

interface PeakProductivityChartProps {
  dateRange: DateRange;
}

export const PeakProductivityChart: FC<PeakProductivityChartProps> = ({ dateRange }) => {
  const { data, isLoading } = usePeakProductivity(dateRange);

  // Aggregate data into time buckets
  const bucketData = useMemo(() => {
    if (!data) return [];

    return TIME_BUCKETS.map(bucket => {
      const hoursInBucket = data
        .filter(d => d.hour_of_day >= bucket.start && d.hour_of_day <= bucket.end)
        .reduce((sum, d) => sum + d.total_hours, 0);

      const sessionsInBucket = data
        .filter(d => d.hour_of_day >= bucket.start && d.hour_of_day <= bucket.end)
        .reduce((sum, d) => sum + d.session_count, 0);

      return {
        name: bucket.name,
        emoji: bucket.emoji,
        hours: hoursInBucket,
        sessions: sessionsInBucket,
      };
    });
  }, [data]);

  const totalHours = bucketData.reduce((sum, b) => sum + b.hours, 0);
  const peakBucket = bucketData.reduce((max, b) => b.hours > max.hours ? b : max, bucketData[0] || { hours: 0 });
  const peakPercentage = totalHours > 0 ? ((peakBucket.hours / totalHours) * 100).toFixed(0) : 0;

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Peak Productivity Times</h3>
        <div className="animate-pulse h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0 || totalHours === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Peak Productivity Times</h3>
        <div className="text-center py-12 text-gray-400">
          No data available for selected date range
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-2 text-gray-100">Peak Productivity Times</h3>

      {/* Insight */}
      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <div className="text-sm text-blue-400">
          {peakBucket.emoji} You're most productive in the <span className="font-bold">{peakBucket.name}</span>{' '}
          ({peakBucket.hours.toFixed(1)}h, {peakPercentage}% of total)
        </div>
        <div className="text-xs text-blue-400/70 mt-1">
          💡 Schedule deep work tasks during {peakBucket.name.toLowerCase()} hours for optimal performance
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={bucketData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            tick={{ fill: '#d1d5db' }}
            tickFormatter={(value, index) => `${bucketData[index].emoji} ${value}`}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#d1d5db' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}h (${props.payload.sessions} sessions)`,
              'Total Hours'
            ]}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
            }}
          />
          <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
            {bucketData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === peakBucket.name ? '#3b82f6' : '#6b7280'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats breakdown */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        {bucketData.map(bucket => (
          <div
            key={bucket.name}
            className={`p-2 rounded border ${
              bucket.name === peakBucket.name
                ? 'bg-blue-900/20 border-blue-700'
                : 'bg-gray-700/30 border-gray-600'
            }`}
          >
            <div className="text-gray-400">{bucket.emoji} {bucket.name}</div>
            <div className={`font-semibold ${
              bucket.name === peakBucket.name ? 'text-blue-400' : 'text-gray-300'
            }`}>
              {bucket.hours.toFixed(1)}h
            </div>
            <div className="text-gray-500">{bucket.sessions} sessions</div>
          </div>
        ))}
      </div>
    </div>
  );
};
