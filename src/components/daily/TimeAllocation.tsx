/**
 * TimeAllocation - Daily time allocation breakdown by business/area
 * Story 2.5: Daily Goals Progress Tracking (Task 5)
 */

import type { FC } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';

interface TimeAllocationProps {
  date?: Date;
  className?: string;
}

interface AreaTimeData {
  area: string;
  minutes: number;
  hours: number;
  percentage: number;
  color: string;
}

/**
 * Get color for each area (matches theme.css business colors)
 */
const getAreaColor = (area: string): string => {
  const colorMap: Record<string, string> = {
    'Full Stack': '#3b82f6', // blue-500
    'S4': '#06b6d4', // cyan-500
    '808': '#f97316', // orange-500
    'Huge Capital': '#10b981', // green-500
    'Personal': '#ec4899', // pink-500
    'Golf': '#f59e0b', // amber-500
    'Health': '#14b8a6', // teal-500
  };

  return colorMap[area] || '#6b7280'; // Default gray-500
};

/**
 * TimeAllocation - Stacked bar showing time spent per area today
 * Displays horizontal bar chart with area percentages and hover tooltips
 *
 * @param date - Date to show allocation for (defaults to today)
 */
export const TimeAllocation: FC<TimeAllocationProps> = ({
  date = new Date(),
  className = '',
}) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['deep-work', 'daily-allocation', dateString],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('area, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .not('end_time', 'is', null); // Only completed sessions

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // 1 minute
  });

  const areaData = useMemo<AreaTimeData[]>(() => {
    if (sessions.length === 0) return [];

    // Group by area and sum minutes
    const areaMinutes: Record<string, number> = {};

    sessions.forEach(session => {
      const area = session.area || 'Uncategorized';
      areaMinutes[area] = (areaMinutes[area] || 0) + (session.duration_minutes || 0);
    });

    const totalMinutes = Object.values(areaMinutes).reduce((sum, min) => sum + min, 0);

    // Convert to array with percentages
    return Object.entries(areaMinutes)
      .map(([area, minutes]) => ({
        area,
        minutes,
        hours: minutes / 60,
        percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0,
        color: getAreaColor(area),
      }))
      .sort((a, b) => b.minutes - a.minutes); // Sort by most time first
  }, [sessions]);

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const hasData = areaData.length > 0;
  const totalHours = areaData.reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">Time Allocation</h3>
        {hasData && (
          <p className="text-sm text-gray-400">
            Total: {totalHours.toFixed(1)} hours today
          </p>
        )}
      </div>

      {/* No Data State */}
      {!hasData && (
        <div className="text-center py-8">
          <p className="text-gray-500">No time logged yet today</p>
        </div>
      )}

      {/* Stacked Bar Chart */}
      {hasData && (
        <div className="space-y-4">
          {/* Horizontal Stacked Bar */}
          <div className="w-full h-8 bg-gray-900 rounded-lg overflow-hidden flex">
            {areaData.map((area) => (
              <div
                key={area.area}
                className="h-full transition-all duration-300 hover:opacity-80 cursor-pointer group relative"
                style={{
                  width: `${area.percentage}%`,
                  backgroundColor: area.color,
                }}
                title={`${area.area}: ${area.hours.toFixed(1)}h (${area.percentage.toFixed(0)}%)`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap border border-gray-700">
                    {area.area}: {area.hours.toFixed(1)}h
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {areaData.map((area) => (
              <div key={area.area} className="flex items-center gap-2">
                {/* Color Indicator */}
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: area.color }}
                />

                {/* Area Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {area.area}
                  </div>
                  <div className="text-xs text-gray-400">
                    {area.hours.toFixed(1)}h · {area.percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
