import type { FC } from 'react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TaskHub } from '../../types/task';
// import { ResizableTaskBlock } from './ResizableTaskBlock';

interface DailySchedulePanelProps {
  scheduledTasks: TaskHub[];
  onSaveSchedule: (date: Date, schedule: Record<string, string[]>) => void;
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  onTaskRemove?: (taskId: string) => void;
  onTaskResize?: (taskId: string, newStartTime: string, newEndTime: string) => void;
  className?: string;
}

interface TimeSlotProps {
  time: string;
  tasks: TaskHub[];
  date: Date;
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  onTaskRemove?: (taskId: string) => void;
  isSecondHalf?: boolean; // Is this the second 30-min slot of an hour?
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
 * Get business color for task
 */
const getBusinessColor = (task: TaskHub): string => {
  if (task.businesses) {
    const slug = task.businesses.slug;
    if (slug === 'full-stack' || slug === 'fullstack') return 'var(--color-business-fullstack)';
    if (slug === 'huge-capital') return 'var(--color-business-hugecapital)';
    if (slug === 's4') return 'var(--color-business-s4)';
    if (slug === '808') return 'var(--color-business-808)';
  }

  if (task.life_areas) {
    const category = task.life_areas.category.toLowerCase();
    if (category === 'personal') return 'var(--color-area-personal)';
    if (category === 'health') return 'var(--color-area-health)';
    if (category === 'golf') return 'var(--color-area-golf)';
  }

  if (task.area) {
    if (task.area === 'Full Stack') return 'var(--color-business-fullstack)';
    if (task.area === 'Huge Capital') return 'var(--color-business-hugecapital)';
    if (task.area === 'S4') return 'var(--color-business-s4)';
    if (task.area === '808') return 'var(--color-business-808)';
    if (task.area === 'Personal') return 'var(--color-area-personal)';
    if (task.area === 'Health') return 'var(--color-area-health)';
    if (task.area === 'Golf') return 'var(--color-area-golf)';
  }

  return '#6b7280';
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

const TimeSlot: FC<TimeSlotProps> = ({ time, tasks, date, onTaskDrop, onTaskRemove }) => {
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

      {/* Tasks */}
      <div className="flex-1 flex flex-col gap-1.5">
        {tasks.length === 0 ? (
          <div className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Drop task here
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-1 group/task">
              <Badge
                className="text-white border-0 text-xs px-2 py-1 font-medium justify-start flex-1"
                style={{ backgroundColor: getBusinessColor(task) }}
                title={task.task_name}
              >
                <span className="truncate">{task.task_name}</span>
              </Badge>
              {onTaskRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskRemove(task.id);
                  }}
                  className="opacity-0 group-hover/task:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                  title="Remove from schedule"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
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
  scheduledTasks,
  onTaskDrop,
  onTaskRemove,
  onTaskResize: _onTaskResize,
  className = '',
}) => {
  // Always get fresh "today" - don't cache in state initialization
  const getTodayLocal = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getTodayLocal());


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

  // Filter tasks for selected date and group by time
  const tasksByTime: Record<string, TaskHub[]> = {};

  // Format selected date as YYYY-MM-DD using local time
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const filteredForDate = scheduledTasks.filter(
    (task) => task.scheduled_date === selectedDateStr
  );


  filteredForDate.forEach((task) => {
    // Normalize time format: Remove seconds if present (e.g., "12:00:00" -> "12:00")
    const rawTime = task.scheduled_time || '09:00';
    const time = rawTime.substring(0, 5); // Get HH:MM only
    if (!tasksByTime[time]) {
      tasksByTime[time] = [];
    }
    tasksByTime[time].push(task);
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

        {/* Task Count */}
        {filteredForDate.length > 0 && (
          <div className="text-xs text-gray-400 mt-2">
            {filteredForDate.length} task{filteredForDate.length !== 1 ? 's' : ''} scheduled
          </div>
        )}
      </CardHeader>

      {/* Time Slots */}
      <CardContent className="flex-1 overflow-y-auto p-0">
        {TIME_SLOTS.map((time) => (
          <TimeSlot
            key={time}
            time={time}
            tasks={tasksByTime[time] || []}
            date={selectedDate}
            onTaskDrop={onTaskDrop}
            onTaskRemove={onTaskRemove}
          />
        ))}
      </CardContent>
    </Card>
  );
};

// Suppress TS6133 for intentionally unused helper function
void _calculateTopPosition;
