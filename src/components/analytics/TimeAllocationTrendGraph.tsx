/**
 * TimeAllocationTrendGraph - 3-month trend analysis line graph
 *
 * Shows how time allocation across areas has shifted over time
 * Multiple lines (one per area) with distinct colors
 */

import { type FC, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTimeAllocationTrend, type DateRange } from '@/hooks/useTimeAnalytics';

type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health';

const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

// Colors for each area (matching AreaDistributionPieChart)
const AREA_COLORS: Record<string, string> = {
  'Full Stack': '#3b82f6',
  'S4': '#8b5cf6',
  '808': '#ec4899',
  'Personal': '#f59e0b',
  'Huge Capital': '#10b981',
  'Golf': '#06b6d4',
  'Health': '#ef4444',
};

interface TimeAllocationTrendGraphProps {
  dateRange: DateRange;
}

export const TimeAllocationTrendGraph: FC<TimeAllocationTrendGraphProps> = ({ dateRange }) => {
  const { data: trendData, isLoading } = useTimeAllocationTrend(dateRange);
  const [hiddenAreas, setHiddenAreas] = useState<Set<Area>>(new Set());

  // Transform data: group by date, create object with area properties
  const chartData = React.useMemo(() => {
    if (!trendData) return [];

    const dateMap = new Map<string, any>();

    trendData.forEach(item => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }
      const dateEntry = dateMap.get(item.date);
      if (dateEntry) {
        dateEntry[item.area] = item.hours;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData]);

  const toggleArea = (area: Area) => {
    setHiddenAreas(prev => {
      const next = new Set(prev);
      if (next.has(area)) {
        next.delete(area);
      } else {
        next.add(area);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Time Allocation Trends</h3>
        <div className="animate-pulse h-80 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Time Allocation Trends</h3>
        <div className="text-center py-12 text-gray-400">
          No data available for selected date range
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Time Allocation Trends</h3>
        <div className="text-sm text-gray-400">Daily hours per area</div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fill: '#d1d5db', fontSize: 12 }}
            tickFormatter={(value) => format(parseISO(value), 'MMM d')}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#d1d5db' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            formatter={(value: number) => `${value.toFixed(1)}h`}
            labelFormatter={(label) => format(parseISO(label as string), 'MMM d, yyyy')}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
            }}
          />
          <Legend
            onClick={(e) => toggleArea(e.value as Area)}
            wrapperStyle={{ cursor: 'pointer', color: '#d1d5db' }}
          />

          {AREAS.map(area => (
            <Line
              key={area}
              type="monotone"
              dataKey={area}
              stroke={AREA_COLORS[area]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              hide={hiddenAreas.has(area)}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Click on legend items to show/hide areas
      </div>
    </div>
  );
};

// Add React import for useMemo
import * as React from 'react';
