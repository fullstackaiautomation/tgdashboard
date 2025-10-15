import type { FC } from 'react';
import { useState } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDailySchedule } from '@/hooks/useCalendar';
import type { DailyScheduleBlock, TimeBlockStatus } from '@/types/calendar';
import { formatDateString, getTodayNoon } from '@/utils/dateHelpers';

interface DailySchedulePanelProps {
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  onBlockRemove: (blockId: string) => void;
  className?: string;
}

interface TimeSlotProps {
  time: string;
  blocks: DailyScheduleBlock[];
  date: Date;
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  onBlockRemove: (blockId: string) => void;
}

// Generate time slots from 6:00 AM to 6:00 AM next day (30-minute intervals)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  // 6 AM to 11:30 PM
  for (let hour = 6; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(time);
    }
  }
  // Midnight to 5:30 AM (stop before 6:00 AM to avoid duplicate)
  for (let hour = 0; hour < 6; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

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
 * Get status badge color classes
 */
const getStatusColor = (status: TimeBlockStatus): string => {
  switch (status) {
    case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

/**
 * Get status icon
 */
const getStatusIcon = (status: TimeBlockStatus): React.ReactNode => {
  switch (status) {
    case 'in_progress': return <Clock className="w-3 h-3" />;
    case 'completed': return <CheckCircle className="w-3 h-3" />;
    case 'cancelled': return <XCircle className="w-3 h-3" />;
    default: return null;
  }
};

/**
 * Calculate position in pixels from 6:00 AM
 */
const _calculateTopPosition = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 6 * 60; // 6:00 AM
  const offsetMinutes = totalMinutes >= startMinutes ? totalMinutes - startMinutes : (24 * 60 - startMinutes) + totalMinutes;
  // 40px per 30 minutes
  return (offsetMinutes / 30) * 40;
};

const TimeSlot: FC<TimeSlotProps> = ({ time, blocks, date, onTaskDrop, onBlockRemove }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    const taskData = e.dataTransfer.getData('task');
    if (taskData) {
      const task = JSON.parse(taskData);
      // Format date as YYYY-MM-DD using local timezone (not UTC)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('🎯 Dropping task:', {
        taskName: task.task_name,
        date: date,
        dateStr: dateStr,
        time: time,
        jsDate: new Date(),
        selectedDate: date
      });
      onTaskDrop(task.id, dateStr, time);
    }
  };

  const hour = parseInt(time.split(':')[0]);
  const isCurrentHour = new Date().getHours() === hour;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group flex items-start gap-3 px-3 py-2 border-b border-gray-700/50 min-h-[2.5rem] transition-all ${
        isOver ? 'bg-blue-500/10 border-blue-500' : 'hover:bg-gray-700/20'
      } ${isCurrentHour ? 'bg-yellow-500/5 border-l-2 border-l-yellow-500' : ''}`}
    >
      {/* Time Label */}
      <div className={`w-14 text-xs font-medium shrink-0 pt-0.5 ${
        isCurrentHour ? 'text-yellow-400' : 'text-gray-500'
      }`}>
        {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
      </div>

      {/* Time Blocks */}
      <div className="flex-1 flex flex-col gap-1.5">
        {blocks.length === 0 ? (
          <div className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Drop task here
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.block_id} className="flex items-center gap-2 group/block">
              {/* Status Badge */}
              <Badge
                className={`text-xs px-1.5 py-0.5 border flex items-center gap-1 ${getStatusColor(block.status)}`}
                title={`Status: ${block.status}`}
              >
                {getStatusIcon(block.status)}
                <span className="capitalize">{block.status}</span>
              </Badge>

              {/* Task Name with Area Color */}
              <Badge
                className="text-white border-0 text-xs px-2 py-1 font-medium flex-1"
                style={{ backgroundColor: getAreaColor(block.area) }}
                title={block.task_name}
              >
                <span className="truncate">{block.task_name}</span>
              </Badge>

              {/* Duration Display */}
              <span className="text-xs text-gray-400 shrink-0">
                {format(parseISO(`2000-01-01T${block.start_time}`), 'h:mm a')} -
                {format(parseISO(`2000-01-01T${block.end_time}`), 'h:mm a')}
                <span className="ml-1 text-gray-500">
                  ({calculateDuration(block.start_time, block.end_time)})
                </span>
              </span>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Remove this time block? (Task will not be deleted)')) {
                    onBlockRemove(block.block_id);
                  }
                }}
                className="opacity-0 group-hover/block:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                title="Remove time block"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
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

  // Group time blocks by start time
  const blocksByTime: Record<string, DailyScheduleBlock[]> = {};

  timeBlocks.forEach((block) => {
    // Normalize time format: Get HH:MM only
    const time = block.start_time.substring(0, 5); // Remove seconds
    if (!blocksByTime[time]) {
      blocksByTime[time] = [];
    }
    blocksByTime[time].push(block);
  });

  // Check if selected date is today (using local time)
  const isToday = (() => {
    const now = new Date();
    const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return nowLocal.getTime() === selectedLocal.getTime();
  })();

  return (
    <Card className={`bg-gray-800/60 border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-100 flex items-center justify-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          Daily Schedule
        </CardTitle>

        {/* Day Navigation */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousDay}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant={isToday ? "default" : "outline"}
            size="sm"
            onClick={handleToday}
            className={`flex-1 text-xs font-semibold ${
              isToday
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextDay}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Block Count */}
        {timeBlocks.length > 0 && (
          <div className="text-xs text-gray-400 mt-2">
            {timeBlocks.length} block{timeBlocks.length !== 1 ? 's' : ''} scheduled
          </div>
        )}
      </CardHeader>

      {/* Time Slots */}
      <CardContent className="flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-gray-400">Loading schedule...</div>
          </div>
        ) : (
          TIME_SLOTS.map((time) => (
            <TimeSlot
              key={time}
              time={time}
              blocks={blocksByTime[time] || []}
              date={selectedDate}
              onTaskDrop={onTaskDrop}
              onBlockRemove={onBlockRemove}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

// Suppress TS6133 for intentionally unused helper function
void _calculateTopPosition;
