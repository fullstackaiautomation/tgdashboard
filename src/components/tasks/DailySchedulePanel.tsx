import type { FC } from 'react';
import { useState } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailySchedule } from '@/hooks/useCalendar';
import type { DailyScheduleBlock } from '@/types/calendar';

interface DailySchedulePanelProps {
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  onBlockRemove: (blockId: string) => void;
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
 * TimeBlock component - displays a single scheduled block with absolute positioning
 */
interface TimeBlockProps {
  block: DailyScheduleBlock;
  onRemove: (blockId: string) => void;
}

const TimeBlock: FC<TimeBlockProps> = ({ block, onRemove }) => {
  const blockStyle = calculateBlockStyle(block);
  const color = getAreaColor(block.area);
  // Check if task is completed (either time block is completed OR task itself is marked Done)
  const isCompleted = block.status === 'completed' || block.task_status === 'Done';

  return (
    <div
      className="absolute cursor-pointer hover:opacity-90 transition-opacity group/block border-2 border-gray-900"
      style={{
        ...blockStyle,
        left: '5.5rem', // Start after the time labels (w-20 + padding)
        right: '0.5rem',
        backgroundColor: color,
        padding: '0.5rem',
        borderRadius: '0.25rem',
        zIndex: 10,
        opacity: isCompleted ? 0.5 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`text-lg text-white font-semibold truncate ${isCompleted ? 'line-through' : ''}`}>
            {block.task_name}
          </div>
          <div className="text-base text-white/80">
            {format(parseISO(`2000-01-01T${block.start_time}`), 'h:mm a')} -{' '}
            {format(parseISO(`2000-01-01T${block.end_time}`), 'h:mm a')}
            <span className="ml-1 text-white/60">
              ({calculateDuration(block.start_time, block.end_time)})
            </span>
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
    </div>
  );
};

/**
 * DailySchedulePanel - Modern schedule view with drag-and-drop
 */
export const DailySchedulePanel: FC<DailySchedulePanelProps> = ({
  onTaskDrop,
  onBlockRemove,
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

  const handlePreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1);
      return newDate;
    });
  };

  const handleToday = () => {
    const today = getTodayLocal();
    setSelectedDate(today);
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
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
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
