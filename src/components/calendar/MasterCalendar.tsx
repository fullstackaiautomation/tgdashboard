/**
 * MasterCalendar - Comprehensive calendar view with task scheduling
 *
 * Features:
 * - Weekly and daily views
 * - Visual time blocks for scheduled tasks
 * - Color-coded by area
 * - Click to view/edit time blocks
 * - Drag-and-drop task scheduling (future enhancement)
 */

import { type FC, useState, useRef, useCallback, useEffect } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks,
  addMinutes,
  differenceInMinutes,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { useCalendarView, useWeeklyCalendarSummary, useUpdateTimeBlock } from '@/hooks/useCalendar';
import { useUpdateTask } from '@/hooks/useTasks';
import type { CalendarViewBlock } from '@/types/calendar';
import type { Area } from '@/types/task';

// Area colors (matching App.tsx)
const AREA_COLORS: Record<Area, string> = {
  'Full Stack': '#10b981',  // green
  'Huge Capital': '#a855f7', // purple
  'S4': '#3b82f6',          // blue
  '808': '#eab308',         // yellow
  'Personal': '#ec4899',     // pink
  'Golf': '#f97316',         // orange
  'Health': '#14b8a6',       // teal
};

interface MasterCalendarProps {
  onBlockClick?: (block: CalendarViewBlock) => void;
}

interface DroppableTimeSlotProps {
  date: Date;
  hour: number;
}

const DroppableTimeSlot: FC<DroppableTimeSlotProps> = ({ date, hour }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const slotId = `calendar-slot-${dateStr}-${hour}`;

  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-l border-gray-700 ${
        isOver ? 'bg-blue-500/20 ring-2 ring-inset ring-blue-500' : ''
      }`}
    />
  );
};

interface ResizableTimeBlockProps {
  block: CalendarViewBlock;
  style: React.CSSProperties;
  color: string;
  onClick?: () => void;
}

const ResizableTimeBlock: FC<ResizableTimeBlockProps> = ({ block, style, color, onClick }) => {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [originalTop, setOriginalTop] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [currentTop, setCurrentTop] = useState(parseFloat(style.top as string));
  const [currentHeight, setCurrentHeight] = useState(parseFloat(style.height as string));

  const updateTimeBlock = useUpdateTimeBlock();
  const updateTask = useUpdateTask();
  const blockRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, edge: 'top' | 'bottom') => {
    e.stopPropagation();
    setIsResizing(edge);
    setResizeStartY(e.clientY);
    setOriginalTop(parseFloat(style.top as string));
    setOriginalHeight(parseFloat(style.height as string));
    setCurrentTop(parseFloat(style.top as string));
    setCurrentHeight(parseFloat(style.height as string));
  }, [style.top, style.height]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = e.clientY - resizeStartY;
    const deltaRem = deltaY / 16; // Convert pixels to rem (assuming 16px base)

    // Snap to 15-minute intervals (1rem = 15 minutes)
    const snapToQuarterHour = (value: number) => Math.round(value);

    if (isResizing === 'bottom') {
      // Resize from bottom - change height only
      const rawHeight = originalHeight + deltaRem;
      const snappedHeight = Math.max(1, snapToQuarterHour(rawHeight)); // Minimum 1rem (15 minutes)
      setCurrentHeight(snappedHeight);
    } else if (isResizing === 'top') {
      // Resize from top - change both top and height
      const rawTop = originalTop + deltaRem;
      const snappedTop = Math.max(0, snapToQuarterHour(rawTop));
      const heightDelta = originalTop - snappedTop;
      const snappedHeight = Math.max(1, snapToQuarterHour(originalHeight + heightDelta));
      setCurrentTop(snappedTop);
      setCurrentHeight(snappedHeight);
    }
  }, [isResizing, resizeStartY, originalTop, originalHeight]);

  const handleResizeEnd = useCallback(async () => {
    if (!isResizing) return;

    // Calculate new times based on position
    const topInHours = currentTop / 4; // 4rem = 1 hour
    const heightInHours = currentHeight / 4;

    const baseHour = 6; // Calendar starts at 6 AM

    // Round to nearest 15-minute interval
    const roundToQuarterHour = (minutes: number) => Math.round(minutes / 15) * 15;

    const startTotalMinutes = (baseHour + topInHours) * 60;
    const roundedStartMinutes = roundToQuarterHour(startTotalMinutes);
    const startHour = Math.floor(roundedStartMinutes / 60);
    const startMinutes = roundedStartMinutes % 60;

    const endTotalMinutes = (baseHour + topInHours + heightInHours) * 60;
    const roundedEndMinutes = roundToQuarterHour(endTotalMinutes);
    const endHour = Math.floor(roundedEndMinutes / 60);
    const endMinutes = roundedEndMinutes % 60;

    const newStartTime = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`;
    const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`;

    const newDurationMinutes = roundedEndMinutes - roundedStartMinutes;

    try {
      // Update time block
      await updateTimeBlock.mutateAsync({
        blockId: block.block_id,
        updates: {
          start_time: newStartTime,
          end_time: newEndTime,
          planned_duration_minutes: newDurationMinutes,
        },
      });

      // Calculate hours difference and update task's projected hours
      const originalDurationMinutes = differenceInMinutes(
        parseISO(`2000-01-01T${block.end_time}`),
        parseISO(`2000-01-01T${block.start_time}`)
      );
      const durationDifference = (newDurationMinutes - originalDurationMinutes) / 60; // Convert to hours

      // Update task's hours_projected
      const newHoursProjected = Math.max(0, (block.hours_projected || 0) + durationDifference);

      await updateTask.mutateAsync({
        id: block.task_id,
        updates: {
          hours_projected: newHoursProjected,
        },
        skipConflictCheck: true,
      });

    } catch (error) {
      console.error('Failed to resize time block:', error);
      // Revert to original size
      setCurrentTop(originalTop);
      setCurrentHeight(originalHeight);
    }

    setIsResizing(null);
  }, [isResizing, currentTop, currentHeight, block, updateTimeBlock, updateTask, originalTop, originalHeight]);

  // Add event listeners for mouse move and up
  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const displayStyle = isResizing
    ? { ...style, top: `${currentTop}rem`, height: `${currentHeight}rem` }
    : style;

  return (
    <div
      ref={blockRef}
      className="absolute cursor-pointer hover:opacity-90 transition-opacity group"
      style={{
        ...displayStyle,
        backgroundColor: color,
        padding: '0.5rem',
        borderRadius: '0.25rem',
        zIndex: isResizing ? 20 : 10,
      }}
      onClick={onClick}
    >
      {/* Top resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity"
        onMouseDown={(e) => handleResizeStart(e, 'top')}
        style={{ marginTop: '-2px' }}
      />

      <div className="text-xs text-white font-semibold truncate pointer-events-none">
        {block.task_name}
      </div>
      <div className="text-xs text-white/80 pointer-events-none">
        {format(parseISO(`2000-01-01T${block.start_time}`), 'h:mm a')} -{' '}
        {format(parseISO(`2000-01-01T${block.end_time}`), 'h:mm a')}
      </div>
      {block.status === 'completed' && (
        <div className="text-xs text-white/80 mt-1 pointer-events-none">✓ Completed</div>
      )}

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity"
        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        style={{ marginBottom: '-2px' }}
      />
    </div>
  );
};

export const MasterCalendar: FC<MasterCalendarProps> = ({ onBlockClick }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
  );

  const weekEnd = addDays(currentWeekStart, 6);

  const { data: calendarBlocks = [], isLoading } = useCalendarView(currentWeekStart, weekEnd);
  const { data: weeklySummary = [] } = useWeeklyCalendarSummary(currentWeekStart);

  // Group blocks by date
  const blocksByDate = new Map<string, CalendarViewBlock[]>();
  calendarBlocks.forEach((block) => {
    const dateKey = block.scheduled_date;
    if (!blocksByDate.has(dateKey)) {
      blocksByDate.set(dateKey, []);
    }
    blocksByDate.get(dateKey)!.push(block);
  });

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const handlePrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Time slots (6 AM to 11 PM in 1-hour increments)
  const timeSlots = Array.from({ length: 18 }, (_, i) => i + 6); // 6-23 (6 AM to 11 PM)

  // Helper to parse time string to hour
  const parseTimeToHour = (timeStr: string): number => {
    const [hour] = timeStr.split(':').map(Number);
    return hour;
  };

  // Helper to calculate block position and height
  const calculateBlockStyle = (block: CalendarViewBlock) => {
    const startHour = parseTimeToHour(block.start_time);
    const endHour = parseTimeToHour(block.end_time);
    const startMinutes = parseInt(block.start_time.split(':')[1]);
    const endMinutes = parseInt(block.end_time.split(':')[1]);

    const top = ((startHour - 6) * 60 + startMinutes) / 60; // Hours from 6 AM
    const height = ((endHour - startHour) * 60 + (endMinutes - startMinutes)) / 60;

    return {
      top: `${top * 4}rem`, // 4rem per hour
      height: `${height * 4}rem`,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
        <div className="text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Master Calendar</h2>
            <p className="text-gray-400">
              {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const summary = weeklySummary.find((s) => s.scheduled_date === dateKey);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateKey}
              className={`p-3 rounded-lg border-2 ${
                isToday
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-400' : 'text-gray-100'}`}>
                  {format(day, 'd')}
                </div>
                {summary && (
                  <div className="mt-2 text-xs">
                    <div className="text-gray-400">
                      {summary.total_blocks} {summary.total_blocks === 1 ? 'block' : 'blocks'}
                    </div>
                    <div className="text-gray-500">
                      {Math.round(summary.total_planned_minutes / 60)}h planned
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-8 bg-gray-900 border-b border-gray-700">
          <div className="p-3 text-xs text-gray-500 font-semibold">TIME</div>
          {weekDays.map((day) => (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={`p-3 text-center ${
                isSameDay(day, new Date()) ? 'bg-blue-900/20' : ''
              }`}
            >
              <div className="text-xs text-gray-400">{format(day, 'EEE')}</div>
              <div className="text-sm font-bold text-gray-100">{format(day, 'MMM d')}</div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative">
          {/* Time labels and grid lines */}
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-gray-700"
              style={{ height: '4rem' }}
            >
              <div className="p-2 text-xs text-gray-500">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              {weekDays.map((day) => (
                <DroppableTimeSlot
                  key={`${format(day, 'yyyy-MM-dd')}-${hour}`}
                  date={day}
                  hour={hour}
                />
              ))}
            </div>
          ))}

          {/* Time blocks (absolutely positioned) */}
          {weekDays.map((day, dayIndex) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayBlocks = blocksByDate.get(dateKey) || [];

            return dayBlocks.map((block) => {
              const blockStyle = calculateBlockStyle(block);
              const color = AREA_COLORS[block.area];

              const style = {
                ...blockStyle,
                left: `${((dayIndex + 1) / 8) * 100}%`,
                width: `${100 / 8}%`,
              };

              return (
                <ResizableTimeBlock
                  key={block.block_id}
                  block={block}
                  style={style}
                  color={color}
                  onClick={() => onBlockClick?.(block)}
                />
              );
            });
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4">
        {(Object.keys(AREA_COLORS) as Area[]).map((area) => (
          <div key={area} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: AREA_COLORS[area] }}
            />
            <span className="text-sm text-gray-300">{area}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
