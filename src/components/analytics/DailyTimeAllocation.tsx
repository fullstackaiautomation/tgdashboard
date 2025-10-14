/**
 * DailyTimeAllocation Component
 * Story 4.1: Displays today's time allocation across businesses/life areas
 */

import { type FC, useMemo } from 'react';
import { useTodayTimeAllocation, useYesterdayTimeAllocation } from '@/hooks/useTimeAllocation';
import { Clock, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface DailyTimeAllocationProps {
  className?: string;
  onAreaClick?: (areaName: string) => void;
}

/**
 * Shows today's deep work time allocation with color-coded chips
 * Displays comparison with yesterday and highlights unallocated time
 */
export const DailyTimeAllocation: FC<DailyTimeAllocationProps> = ({
  className = '',
  onAreaClick,
}) => {
  const { data: todayData, isLoading: loadingToday } = useTodayTimeAllocation();
  const { data: yesterdayData, isLoading: loadingYesterday } = useYesterdayTimeAllocation();

  // Calculate totals
  const todayTotal = useMemo(() => {
    if (!todayData) return 0;
    return Object.values(todayData).reduce((sum, hours) => sum + hours, 0);
  }, [todayData]);

  const yesterdayTotal = useMemo(() => {
    if (!yesterdayData) return 0;
    return Object.values(yesterdayData).reduce((sum, hours) => sum + hours, 0);
  }, [yesterdayData]);

  const comparison = todayTotal - yesterdayTotal;
  const unallocatedHours = todayData?.['Unallocated'] || 0;

  // Sort areas by hours (descending)
  const sortedAreas = useMemo(() => {
    if (!todayData) return [];
    return Object.entries(todayData)
      .filter(([name]) => name !== 'Unallocated')
      .sort(([, a], [, b]) => b - a);
  }, [todayData]);

  if (loadingToday) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-32 mb-3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-700 rounded w-24"></div>
            <div className="h-8 bg-gray-700 rounded w-24"></div>
            <div className="h-8 bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!todayData || Object.keys(todayData).length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-100">Today's Deep Work</h3>
        </div>
        <p className="text-gray-400 text-sm">No deep work sessions logged today</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-100">Today's Deep Work</h3>
        </div>

        {/* Total hours with comparison */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-400">
            {todayTotal.toFixed(1)}h
          </span>
          {!loadingYesterday && comparison !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${
              comparison > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {comparison > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(comparison).toFixed(1)}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Area chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {sortedAreas.map(([areaName, hours]) => (
          <button
            key={areaName}
            onClick={() => onAreaClick?.(areaName)}
            className="px-3 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500/30
                     border border-blue-500/50 transition-colors cursor-pointer
                     flex items-center gap-2 group"
          >
            <span className="text-sm font-medium text-blue-300 group-hover:text-blue-200">
              {areaName}
            </span>
            <span className="text-sm font-bold text-blue-100">
              {hours.toFixed(1)}h
            </span>
          </button>
        ))}
      </div>

      {/* Unallocated warning */}
      {unallocatedHours > 0 && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-yellow-500/10
                      border border-yellow-500/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-yellow-300">
            {unallocatedHours.toFixed(1)}h unallocated
          </span>
        </div>
      )}

      {/* Summary text */}
      <div className="mt-3 text-xs text-gray-400">
        {sortedAreas.length > 0 ? (
          <>
            Today: {sortedAreas.slice(0, 3).map(([name, hours], idx) => (
              <span key={name}>
                {idx > 0 && ', '}
                <span className="text-gray-300">{hours.toFixed(1)}h</span> {name}
              </span>
            ))}
            {sortedAreas.length > 3 && ` +${sortedAreas.length - 3} more`}
          </>
        ) : (
          'No sessions logged yet'
        )}
      </div>
    </div>
  );
};
