import type { FC } from 'react';
import { useState } from 'react';
import { format, parseISO, differenceInMinutes, addMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailySchedule, useUpdateTimeBlock } from '@/hooks/useCalendar';
import type { DailyScheduleBlock } from '@/types/calendar';

interface DailySchedulePanelProps {
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  onBlockRemove: (blockId: string) => void;
  onDateChange?: (date: Date) => void;
  className?: string;
}

// Generate hourly time slots from 6:00 AM to 6:00 AM next day (24 hours)
const TIME_SLOTS = [
  ...Array.from({ length: 18 }, (_, i) => i + 6), // 6-23 (6 AM to 11 PM)
  ...Array.from({ length: 6 }, (_, i) => i), // 0-5 (12 AM to 5 AM)
];

/**
 * Get area color from area string
 */
const getAreaColor = (area: string): string => {
  if (area === 'Full Stack') return 'var(--color-business-fullstack)';
  if (area === 'Huge Capital') return 'var(--color-business-hugecapital)';
  if (area === 'S4') return 'var(--color-business-s4)';
  if (area === '808') return 'var(--color-business-808)';
  if (area === 'Personal') return 'var(--color-area-personal)';
  if (area === 'Health') return 'var(--color-area-health)';
  if (area === 'Golf') return 'var(--color-area-golf)';
  return '#6b7280';
};

/**
 * Calculate block position and height (4rem = 1 hour, like Master Calendar)
 */
const calculateBlockStyle = (block: DailyScheduleBlock) => {
  const [startHour, startMin] = block.start_time.split(':').map(Number);
  const [endHour, endMin] = block.end_time.split(':').map(Number);

  // Calculate position from 6 AM (top of schedule)
  const top = ((startHour - 6) * 60 + startMin) / 60; // Hours from 6 AM
  const height = ((endHour - startHour) * 60 + (endMin - startMin)) / 60; // Duration in hours

  return {
    top: `${top * 4}rem`, // 4rem per hour
    height: `${height * 4}rem`,
  };
};

/**
 * Calculate duration display string
 */
const calculateDuration = (startTime: string, endTime: string): string => {
  const start = parseISO(`2000-01-01T${startTime}`);
  const end = parseISO(`2000-01-01T${endTime}`);
  const minutes = differenceInMinutes(end, start);

  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours === 1) return '1h';
  return `${hours.toFixed(1)}h`;
};

/**
 * Calculate z-index for stacking blocks - earlier blocks get higher z-index
 */
const calculateZIndex = (blocks: DailyScheduleBlock[]): Map<string, number> => {
  const zIndexMap = new Map<string, number>();

  // Sort blocks by start time (earliest first)
  const sortedBlocks = [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Assign z-index: earlier blocks get higher z-index so they appear on top
  sortedBlocks.forEach((block, index) => {
    zIndexMap.set(block.block_id, sortedBlocks.length - index + 10);
  });

  return zIndexMap;
};

/**
 * TimeBlock component - displays a single scheduled block with absolute positioning and drag-to-reposition
 */
interface TimeBlockProps {
  block: DailyScheduleBlock;
  onRemove: (blockId: string) => void;
  onMove: (blockId: string, newStartTime: string, newEndTime: string) => void;
  stackZIndex?: number;
}

const TimeBlock: FC<TimeBlockProps> = ({ block, onRemove, onMove, stackZIndex = 10 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isResizingTop, setIsResizingTop] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);

  const blockStyle = calculateBlockStyle(block);
  const color = getAreaColor(block.area);
  // Check if task is completed (either time block is completed OR task itself is marked Done)
  const isCompleted = block.status === 'completed' || block.task_status === 'Done';

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    // Store the offset from the top of the block to where the user grabbed it
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset(e.clientY - rect.top);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);

    // Calculate where the block was dropped
    const scheduleContainer = e.currentTarget.closest('.relative');
    if (!scheduleContainer) return;

    const containerRect = scheduleContainer.getBoundingClientRect();
    const dropY = e.clientY - containerRect.top - dragOffset;

    // Convert pixels to hours from 6 AM (4rem = 1 hour)
    const hoursFrom6AM = dropY / (4 * 16); // 16px = 1rem

    // Snap to 15-minute increments
    const totalMinutes = Math.round(hoursFrom6AM * 4) * 15; // Round to nearest 15 min
    const newStartHour = 6 + Math.floor(totalMinutes / 60);
    const newStartMin = totalMinutes % 60;

    // Calculate duration of the block
    const duration = differenceInMinutes(
      parseISO(`2000-01-01T${block.end_time}`),
      parseISO(`2000-01-01T${block.start_time}`)
    );

    // Calculate new times
    const newStartTime = `${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}:00`;
    const newEndDate = addMinutes(parseISO(`2000-01-01T${newStartTime}`), duration);
    const newEndTime = format(newEndDate, 'HH:mm:ss');

    // Update the block position
    if (newStartTime !== block.start_time) {
      onMove(block.block_id, newStartTime, newEndTime);
    }
  };

  const handleResizeTopStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingTop(true);

    const scheduleContainer = document.querySelector('.discrete-scrollbar');
    if (!scheduleContainer) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const containerRect = scheduleContainer.getBoundingClientRect();
      const scrollTop = scheduleContainer.scrollTop;
      const mouseY = moveEvent.clientY - containerRect.top + scrollTop;

      // Convert pixels to hours from 6 AM (4rem = 1 hour, 1rem = 16px)
      const hoursFrom6AM = mouseY / (4 * 16);

      // Snap to 15-minute increments
      const totalMinutes = Math.round(hoursFrom6AM * 4) * 15;
      const newStartHour = 6 + Math.floor(totalMinutes / 60);
      const newStartMin = totalMinutes % 60;

      const newStartTime = `${String(newStartHour).padStart(2, '0')}:${String(newStartMin).padStart(2, '0')}:00`;

      // Don't let start time go past end time
      if (newStartTime < block.end_time) {
        onMove(block.block_id, newStartTime, block.end_time);
      }
    };

    const handleMouseUp = () => {
      setIsResizingTop(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeBottomStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingBottom(true);

    const scheduleContainer = document.querySelector('.discrete-scrollbar');
    if (!scheduleContainer) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const containerRect = scheduleContainer.getBoundingClientRect();
      const scrollTop = scheduleContainer.scrollTop;
      const mouseY = moveEvent.clientY - containerRect.top + scrollTop;

      // Convert pixels to hours from 6 AM (4rem = 1 hour, 1rem = 16px)
      const hoursFrom6AM = mouseY / (4 * 16);

      // Snap to 15-minute increments
      const totalMinutes = Math.round(hoursFrom6AM * 4) * 15;
      const newEndHour = 6 + Math.floor(totalMinutes / 60);
      const newEndMin = totalMinutes % 60;

      const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}:00`;

      // Don't let end time go before start time
      if (newEndTime > block.start_time) {
        onMove(block.block_id, block.start_time, newEndTime);
      }
    };

    const handleMouseUp = () => {
      setIsResizingBottom(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`absolute cursor-move hover:opacity-90 transition-opacity group/block border-2 border-gray-900 ${isDragging || isResizingTop || isResizingBottom ? 'opacity-50' : ''}`}
      style={{
        ...blockStyle,
        left: '5.5rem',
        right: '0.5rem',
        backgroundColor: color,
        padding: '0.5rem',
        borderRadius: '0.25rem',
        zIndex: isDragging || isResizingTop || isResizingBottom ? 50 : stackZIndex,
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      {/* Top resize handle */}
      <div
        onMouseDown={handleResizeTopStart}
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 transition-colors"
        style={{ marginTop: '-4px' }}
        title="Drag to adjust start time"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`text-lg text-white font-semibold truncate ${isCompleted ? 'line-through' : ''}`}>
              {block.task_name}
            </div>
            <div className="text-sm text-white/80 whitespace-nowrap">
              {format(parseISO(`2000-01-01T${block.start_time}`), 'h:mm a')} - {format(parseISO(`2000-01-01T${block.end_time}`), 'h:mm a')} ({calculateDuration(block.start_time, block.end_time)})
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Remove this time block? (Task will not be deleted)')) {
              onRemove(block.block_id);
            }
          }}
          className="opacity-0 group-hover/block:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 shrink-0"
          title="Remove time block"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom resize handle */}
      <div
        onMouseDown={handleResizeBottomStart}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 transition-colors"
        style={{ marginBottom: '-4px' }}
        title="Drag to adjust end time"
      />
    </div>
  );
};

/**
 * DailySchedulePanel - Modern schedule view with drag-and-drop
 */
export const DailySchedulePanel: FC<DailySchedulePanelProps> = ({
  onTaskDrop,
  onBlockRemove,
  onDateChange,
  className = '',
}) => {
  // Always get fresh "today" - don't cache in state initialization
  const getTodayLocal = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getTodayLocal());

  // Fetch time blocks from database
  const { data: timeBlocks = [], isLoading } = useDailySchedule(selectedDate);

  // Calculate z-index for stacking blocks (earlier blocks on top)
  const zIndexMap = calculateZIndex(timeBlocks);

  // Update time block hook
  const updateTimeBlock = useUpdateTimeBlock();

  const handleBlockMove = (blockId: string, newStartTime: string, newEndTime: string) => {
    updateTimeBlock.mutate({
      blockId,
      updates: {
        start_time: newStartTime,
        end_time: newEndTime,
      },
    });
  };

  const handlePreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1);
      onDateChange?.(newDate);
      return newDate;
    });
  };

  const handleToday = () => {
    const today = getTodayLocal();
    setSelectedDate(today);
    onDateChange?.(today);
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
      onDateChange?.(newDate);
      return newDate;
    });
  };

  // Check if selected date is today, past, or future (using local time)
  const dateComparison = (() => {
    const now = new Date();
    const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    if (nowLocal.getTime() === selectedLocal.getTime()) return 'today';
    if (selectedLocal.getTime() < nowLocal.getTime()) return 'past';
    return 'future';
  })();

  const isToday = dateComparison === 'today';

  return (
    <Card className={`bg-gray-800/60 border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        {/* Day Navigation */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={handlePreviousDay}
            className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:border-gray-500 px-4 h-14 transition-all"
          >
            <ChevronLeft className="w-7 h-7" />
          </Button>

          <Button
            variant={isToday ? "default" : "default"}
            size="default"
            onClick={handleToday}
            className={`w-80 text-2xl font-semibold py-3 h-14 text-white border-0 shadow-md transition-all ${
              dateComparison === 'today'
                ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                : dateComparison === 'past'
                ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
            }`}
          >
            {isToday ? "Today's Schedule" : `${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} Schedule`}
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={handleNextDay}
            className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:border-gray-500 px-4 h-14 transition-all"
          >
            <ChevronRight className="w-7 h-7" />
          </Button>
        </div>
      </CardHeader>

      {/* Time Grid */}
      <CardContent className="flex-1 overflow-y-auto p-0 mt-4 discrete-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-400">Loading schedule...</div>
          </div>
        ) : (
          <div className="relative">
            {/* Time slots (grid lines and labels) */}
            {TIME_SLOTS.map((hour) => {
              const isCurrentHour = new Date().getHours() === hour;

              return (
                <div
                  key={hour}
                  className={`flex items-start border-b border-gray-700/50 ${
                    isCurrentHour ? 'bg-yellow-500/5 border-l-2 border-l-yellow-500' : ''
                  }`}
                  style={{ height: '4rem' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskData = e.dataTransfer.getData('task');
                    if (taskData) {
                      const task = JSON.parse(taskData);
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      const time = `${String(hour).padStart(2, '0')}:00`;
                      onTaskDrop(task.id, dateStr, time);
                    }
                  }}
                >
                  <div className={`w-20 text-base font-medium px-3 pt-1 shrink-0 ${
                    isCurrentHour ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {format(new Date().setHours(hour, 0), 'h a')}
                  </div>
                </div>
              );
            })}

            {/* Time blocks (absolutely positioned) */}
            {timeBlocks.map((block) => (
              <TimeBlock
                key={block.block_id}
                block={block}
                onRemove={onBlockRemove}
                onMove={handleBlockMove}
                stackZIndex={zIndexMap.get(block.block_id) ?? 10}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
