/**
 * MonthlyTimeTrend Component
 * Story 4.1: Line chart showing time allocation trends over 30 days
 */

import { type FC, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { useMonthlyTimeAllocation } from '@/hooks/useTimeAllocation';
import { format, startOfMonth, subDays } from 'date-fns';

interface MonthlyTimeTrendProps {
  monthStart?: Date;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  [areaName: string]: number | string;
}

/**
 * Displays line chart showing time allocation trends over 30 days
 * Each business/life area is a separate line with distinct color
 */
export const MonthlyTimeTrend: FC<MonthlyTimeTrendProps> = ({
  monthStart = subDays(new Date(), 29), // Last 30 days
  className = '',
}) => {
  const { data: monthlyData, isLoading } = useMonthlyTimeAllocation(monthStart);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];

    // Group by day_date
    const dayMap = new Map<string, ChartDataPoint>();

    // Fill in data from API
    monthlyData.forEach(({ day_date, area_name, hours }) => {
      if (!dayMap.has(day_date)) {
        dayMap.set(day_date, {
          date: day_date,
          displayDate: format(new Date(day_date), 'MMM d'),
        });
      }
      const existing = dayMap.get(day_date)!;
      existing[area_name] = hours;
    });

    // Sort by date
    return Array.from(dayMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [monthlyData]);

  // Extract unique areas for lines
  const areas = useMemo(() => {
    if (!monthlyData) return [];
    const areaSet = new Set<string>();
    monthlyData.forEach(({ area_name }) => areaSet.add(area_name));
    return Array.from(areaSet).filter(name => name !== 'Unallocated');
  }, [monthlyData]);

  // Color mapping for areas
  const getColorForArea = (areaName: string): string => {
    const colors: Record<string, string> = {
      'Full Stack': '#3b82f6',
      'Huge Capital': '#10b981',
      'S4': '#f59e0b',
      '808': '#ec4899',
      'Service SaaS': '#8b5cf6',
      'Health': '#ef4444',
      'Golf': '#14b8a6',
      'Personal': '#6366f1',
    };
    return colors[areaName] || '#6b7280';
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-96 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          30-Day Time Allocation Trend
        </h3>
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-400">No deep work sessions in the last 30 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        30-Day Time Allocation Trend
      </h3>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="displayDate"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9ca3af', fontSize: '14px' },
            }}
            stroke="#9ca3af"
            style={{ fontSize: '14px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value: number) => `${value.toFixed(1)}h`}
            labelStyle={{ color: '#f3f4f6', marginBottom: '8px' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          {/* Line for each area */}
          {areas.map((areaName) => (
            <Line
              key={areaName}
              type="monotone"
              dataKey={areaName}
              stroke={getColorForArea(areaName)}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false} // Don't connect lines across gaps (days with no data)
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
