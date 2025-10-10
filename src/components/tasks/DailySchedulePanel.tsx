import type { FC } from 'react';
import { useState } from 'react';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import type { TaskHub } from '../../types/task';

interface DailySchedulePanelProps {
  scheduledTasks: TaskHub[];
  onSaveSchedule: (date: Date, schedule: Record<string, string[]>) => void;
  onTaskDrop: (taskId: string, date: string, time: string) => void;
  className?: string;
}

interface TimeSlotProps {
  time: string;
  tasks: TaskHub[];
  date: Date;
  onTaskDrop: (taskId: string, date: string, time: string) => void;
}

// Generate time slots from 12:00 AM to 11:30 PM (30-minute intervals)
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const TimeSlot: FC<TimeSlotProps> = ({ time, tasks, date, onTaskDrop }) => {
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
      const dateStr = format(date, 'yyyy-MM-dd');
      onTaskDrop(task.id, dateStr, time);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex items-start gap-2 px-3 py-2 border-b border-gray-700 min-h-[3rem] transition-colors ${
        isOver ? 'bg-yellow-900/20 border-yellow-500' : 'hover:bg-gray-700/30'
      }`}
    >
      {/* Time Label */}
      <div className="w-16 text-xs text-gray-400 font-medium shrink-0">
        {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
      </div>

      {/* Tasks */}
      <div className="flex-1 flex flex-col gap-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="px-2 py-1 text-xs bg-blue-900/40 text-blue-300 rounded border border-blue-500/50 truncate"
            title={task.task_name}
          >
            {task.task_name}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * DailySchedulePanel - Schedule view with drag-and-drop time slots
 */
export const DailySchedulePanel: FC<DailySchedulePanelProps> = ({
  scheduledTasks,
  onSaveSchedule,
  onTaskDrop,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  const handlePreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const handleSave = () => {
    // Group tasks by time slot
    const schedule: Record<string, string[]> = {};
    scheduledTasks
      .filter(
        (task) =>
          task.scheduled_date &&
          format(new Date(task.scheduled_date), 'yyyy-MM-dd') ===
            format(selectedDate, 'yyyy-MM-dd')
      )
      .forEach((task) => {
        const time = task.scheduled_time || '09:00';
        if (!schedule[time]) {
          schedule[time] = [];
        }
        schedule[time].push(task.id);
      });

    onSaveSchedule(selectedDate, schedule);
  };

  // Filter tasks for selected date and group by time
  const tasksByTime: Record<string, TaskHub[]> = {};
  const filteredForDate = scheduledTasks.filter(
    (task) =>
      task.scheduled_date &&
      format(new Date(task.scheduled_date), 'yyyy-MM-dd') ===
        format(selectedDate, 'yyyy-MM-dd')
  );

  console.log('DailySchedulePanel - All scheduled tasks:', scheduledTasks.length);
  console.log('DailySchedulePanel - Filtered for date:', filteredForDate.length, format(selectedDate, 'yyyy-MM-dd'));

  filteredForDate.forEach((task) => {
    const time = task.scheduled_time || '09:00';
    if (!tasksByTime[time]) {
      tasksByTime[time] = [];
    }
    tasksByTime[time].push(task);
    console.log('Added task to time slot:', time, task.task_name);
  });

  const isToday =
    format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-yellow-400 mb-3">Today's Schedule</h2>

        {/* Day Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousDay}
            className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleToday}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              isToday
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isToday ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
          </button>

          <button
            onClick={handleNextDay}
            className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            title="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          Save Schedule
        </button>
      </div>

      {/* Time Slots */}
      <div className="flex-1 overflow-y-auto">
        {TIME_SLOTS.map((time) => (
          <TimeSlot
            key={time}
            time={time}
            tasks={tasksByTime[time] || []}
            date={selectedDate}
            onTaskDrop={onTaskDrop}
          />
        ))}
      </div>
    </div>
  );
};
