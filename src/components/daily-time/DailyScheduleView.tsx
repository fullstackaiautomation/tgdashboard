/**
 * DailyScheduleView - Shows planned time blocks for a specific day
 * Displays all scheduled tasks from task_time_blocks table
 */

import { type FC } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useDailySchedule } from '@/hooks/useCalendar';
import type { Area } from '@/types/task';

interface DailyScheduleViewProps {
  selectedDate: Date;
}

// Area colors (matching App.tsx and MasterCalendar)
const AREA_COLORS: Record<Area, string> = {
  'Full Stack': '#10b981',  // green
  'Huge Capital': '#a855f7', // purple
  'S4': '#3b82f6',          // blue
  '808': '#eab308',         // yellow
  'Personal': '#ec4899',     // pink
  'Golf': '#f97316',         // orange
  'Health': '#14b8a6',       // teal
};

export const DailyScheduleView: FC<DailyScheduleViewProps> = ({ selectedDate }) => {
  const { data: schedule = [], isLoading } = useDailySchedule(selectedDate);

  // Sort schedule by start time
  const sortedSchedule = [...schedule].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time);
  });

  // Calculate total planned time
  const totalPlannedMinutes = sortedSchedule.reduce((sum, block) => sum + block.planned_duration_minutes, 0);
  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-100">📅 Planned Schedule</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading schedule...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-100">📅 Planned Schedule</h2>
        <div className="text-xs md:text-sm text-gray-400">
          {sortedSchedule.length} {sortedSchedule.length === 1 ? 'block' : 'blocks'} · {totalPlannedHours}h planned
        </div>
      </div>

      {sortedSchedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Clock className="w-12 h-12 mb-3 opacity-50" />
          <p>No scheduled time blocks for this day</p>
          <p className="text-sm mt-1">Add time blocks from the Calendar page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSchedule.map((block) => {
            const color = AREA_COLORS[block.area];
            const isCompleted = block.status === 'completed';

            return (
              <div
                key={block.block_id}
                className="border-2 border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                      <h3 className="font-semibold text-gray-100">{block.task_name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(`2000-01-01T${block.start_time}`), 'h:mm a')} -{' '}
                        {format(parseISO(`2000-01-01T${block.end_time}`), 'h:mm a')}
                      </span>
                      <span>·</span>
                      <span>{block.planned_duration_minutes} min</span>
                    </div>
                    <div className="mt-2">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: color }}
                      >
                        {block.area}
                      </span>
                    </div>
                    {block.notes && (
                      <p className="mt-2 text-sm text-gray-500 italic">{block.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
