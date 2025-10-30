/**
 * WeeklyTimeChart Component
 * Story 4.1: Stacked bar chart showing time allocation across the week
 */

import { type FC, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useWeeklyTimeAllocation } from '@/hooks/useTimeAllocation';
import { format, startOfWeek } from 'date-fns';

interface WeeklyTimeChartProps {
  weekStart?: Date;
  className?: string;
}

interface ChartDataPoint {
  day: string;
  date: string;
  [areaName: string]: number | string;
}

/**
 * Displays a stacked bar chart of time allocation across Mon-Sun
 * Each business/life area is a colored segment in the stacked bar
 */
export const WeeklyTimeChart: FC<WeeklyTimeChartProps> = ({
  weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  className = '',
}) => {
  const { data: weeklyData, isLoading } = useWeeklyTimeAllocation(weekStart);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return [];

    // Group by day_date
    const dayMap = new Map<string, ChartDataPoint>();

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dayMap.set(dateStr, {
        day: format(date, 'EEE'), // Mon, Tue, Wed, etc.
        date: dateStr,
      });
    }

    // Fill in hours per area
    weeklyData.forEach(({ day_date, area_name, hours }) => {
      const existing = dayMap.get(day_date);
      if (existing) {
        existing[area_name] = hours;
      }
    });

    return Array.from(dayMap.values());
  }, [weeklyData, weekStart]);

  // Extract unique areas for bars
  const areas = useMemo(() => {
    if (!weeklyData) return [];
    const areaSet = new Set<string>();
    weeklyData.forEach(({ area_name }) => areaSet.add(area_name));
    return Array.from(areaSet).filter(name => name !== 'Unallocated');
  }, [weeklyData]);

  // Color mapping for areas (you can customize this)
  const getColorForArea = (areaName: string): string => {
    const colors: Record<string, string> = {
      'Full Stack': '#3b82f6', // blue
      'Huge Capital': '#10b981', // green
      'S4': '#f59e0b', // amber
      '808': '#ec4899', // pink
      'Service SaaS': '#8b5cf6', // purple
      'Health': '#ef4444', // red
      'Golf': '#14b8a6', // teal
      'Personal': '#6366f1', // indigo
    };
    return colors[areaName] || '#6b7280'; // gray fallback
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Weekly Time Allocation</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-400">No deep work sessions logged this week</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Weekly Time Allocation
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="day"
            stroke="#9ca3af"
            style={{ fontSize: '14px' }}
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

          {/* Stacked bars for each area */}
          {areas.map((areaName) => (
            <Bar
              key={areaName}
              dataKey={areaName}
              stackId="a"
              fill={getColorForArea(areaName)}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
