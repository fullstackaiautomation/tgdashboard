/**
 * WeeklyHeatmap - Weekly time allocation heatmap visualization
 *
 * Displays a 7x7 grid: Y-axis = 7 life areas, X-axis = days (Mon-Sun)
 * Color intensity shows hours spent per area per day
 */

import { type FC, useState } from 'react';
import { startOfWeek, addDays, format, getDay } from 'date-fns';
import { useWeeklyHeatmap } from '@/hooks/useTimeAnalytics';

type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health';

const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

interface WeeklyHeatmapProps {
  weekStart?: Date;
}

export const WeeklyHeatmap: FC<WeeklyHeatmapProps> = ({ weekStart }) => {
  const start = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const { data: heatmapData, isLoading } = useWeeklyHeatmap(start);
  const [hoveredCell, setHoveredCell] = useState<{ area: Area; day: number } | null>(null);

  // Generate days array (Mon-Sun)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  // Get hours for a specific area and day
  const getHours = (area: Area, dayDate: Date): number => {
    if (!heatmapData) return 0;
    const formattedDate = format(dayDate, 'yyyy-MM-dd');
    const entry = heatmapData.find(
      d => d.area === area && d.day_date === formattedDate
    );
    return entry?.hours || 0;
  };

  // Get color intensity based on hours
  const getColorClass = (hours: number): string => {
    if (hours === 0) return 'bg-gray-800 border-gray-700';
    if (hours <= 2) return 'bg-blue-900/40 border-blue-800';
    if (hours <= 4) return 'bg-blue-700/60 border-blue-600';
    if (hours <= 6) return 'bg-blue-600/80 border-blue-500';
    return 'bg-blue-500 border-blue-400';
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Weekly Time Heatmap</h3>
        <div className="animate-pulse h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Weekly Time Heatmap</h3>
        <div className="text-sm text-gray-400">
          {format(start, 'MMM d')} - {format(addDays(start, 6), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <span>Hours:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"></div>
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-900/40 border border-blue-800 rounded"></div>
          <span>1-2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-700/60 border border-blue-600 rounded"></div>
          <span>3-4</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-600/80 border border-blue-500 rounded"></div>
          <span>5-6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-500 border border-blue-400 rounded"></div>
          <span>7+</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-gray-400 w-32">Area</th>
              {days.map((day, idx) => (
                <th key={idx} className="p-2 text-center text-sm font-medium text-gray-400 min-w-[80px]">
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-xs text-gray-500">{format(day, 'M/d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AREAS.map(area => (
              <tr key={area}>
                <td className="p-2 text-sm font-medium text-gray-300">{area}</td>
                {days.map((day, dayIdx) => {
                  const hours = getHours(area, day);
                  const isHovered = hoveredCell?.area === area && hoveredCell?.day === dayIdx;

                  return (
                    <td key={dayIdx} className="p-2">
                      <div
                        className={`h-16 w-full ${getColorClass(hours)} border rounded cursor-pointer transition-all flex items-center justify-center ${
                          isHovered ? 'ring-2 ring-orange-500 scale-105' : 'hover:opacity-80'
                        }`}
                        onMouseEnter={() => setHoveredCell({ area, day: dayIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${area}: ${hours.toFixed(1)}h on ${format(day, 'MMM d')}`}
                      >
                        {hours > 0 && (
                          <span className="text-sm font-semibold text-gray-100">
                            {hours.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div className="mt-4 p-3 bg-gray-700 rounded border border-gray-600 text-sm">
          <span className="font-medium text-gray-100">{hoveredCell.area}</span>
          <span className="text-gray-400"> on </span>
          <span className="font-medium text-gray-100">
            {format(days[hoveredCell.day], 'EEEE, MMM d')}
          </span>
          <span className="text-gray-400">: </span>
          <span className="font-bold text-orange-400">
            {getHours(hoveredCell.area, days[hoveredCell.day]).toFixed(1)} hours
          </span>
        </div>
      )}
    </div>
  );
};
