/**
 * TaskScheduler - Component for scheduling tasks to calendar time blocks
 *
 * Features:
 * - Shows unscheduled tasks
 * - Quick schedule with date/time picker
 * - Time conflict detection
 * - Smart suggestions based on task duration and due date
 */

import { type FC, useState, useMemo, useEffect } from 'react';
import { format, addMinutes, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns';
import { Clock, AlertTriangle, Plus, X, Filter, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import {
  useUnscheduledTasks,
  useCreateTimeBlock,
  useTimeBlockConflicts,
} from '@/hooks/useCalendar';
import { useTaskTimeBlocks } from '@/hooks/useTaskTimeBlocks';
import type { UnscheduledTask } from '@/types/calendar';
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

const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

interface TaskSchedulerProps {
  onScheduleComplete?: () => void;
}

interface DraggableTaskCardProps {
  task: UnscheduledTask;
  isSelected: boolean;
  onQuickSchedule: (task: UnscheduledTask) => void;
  onClearSelection: () => void;
  onScheduleStatusChange: (taskId: string, isScheduled: boolean) => void;
}

const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task, isSelected, onQuickSchedule, onClearSelection, onScheduleStatusChange }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.task_id}`,
    data: task,
  });

  // Fetch time blocks for this task
  const { data: timeBlocks = [] } = useTaskTimeBlocks(task.task_id);
  const isCompleted = task.status === 'Done';

  // Get the earliest scheduled time block
  const earliestBlock = timeBlocks.length > 0 ? timeBlocks[0] : null;

  // Report schedule status to parent
  const isScheduled = timeBlocks.length > 0;
  useEffect(() => {
    onScheduleStatusChange(task.task_id, isScheduled);
  }, [task.task_id, isScheduled]);

  // Determine button state and text
  const buttonState = isCompleted ? 'completed' : isScheduled ? 'scheduled' : 'schedule';

  const getButtonText = () => {
    if (buttonState === 'completed') return 'Completed';
    if (buttonState === 'schedule') return 'Schedule';
    if (earliestBlock) {
      const date = format(parseISO(earliestBlock.scheduled_date), 'MMM d');
      const time = format(parseISO(`2000-01-01T${earliestBlock.start_time}`), 'h:mm a');
      return `${date} ${time}`;
    }
    return 'Scheduled';
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-lg border-2 transition-all ${
        isDragging
          ? 'opacity-50 cursor-grabbing'
          : 'cursor-grab'
      } ${
        isSelected
          ? 'border-blue-500'
          : 'border-transparent hover:border-gray-600'
      }`}
      style={{
        backgroundColor: isSelected ? undefined : AREA_COLORS[task.area]
      }}
      onClick={() => onQuickSchedule(task)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-white/70 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">{task.task_name}</span>
              {task.priority === 'High' && (
                <span className="px-2 py-0.5 bg-red-500/30 text-white text-xs rounded">
                  High Priority
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-white/80">
              {task.due_date && (
                <>
                  <span>•</span>
                  <span>Due {format(parseISO(task.due_date), 'MMM d')}</span>
                </>
              )}
              {task.hours_remaining > 0 && (
                <>
                  <span>•</span>
                  <span>{task.hours_remaining.toFixed(1)}h remaining</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isSelected ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearSelection();
            }}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickSchedule(task);
            }}
            disabled={buttonState === 'completed'}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              buttonState === 'completed'
                ? 'bg-green-600 text-white cursor-default'
                : buttonState === 'scheduled'
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {getButtonText()}
          </button>
        )}
      </div>
    </div>
  );
};

type DateFilter = 'All Tasks' | 'Due Today' | 'Due This Week' | 'Due Next Week' | 'Due This Month';
type ScheduleFilter = 'All Tasks' | 'Scheduled' | 'Unscheduled';

export const TaskScheduler: FC<TaskSchedulerProps> = ({ onScheduleComplete }) => {
  const [selectedArea, setSelectedArea] = useState<Area | 'All Areas'>('All Areas');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('All Tasks');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<ScheduleFilter>('All Tasks');
  const { data: unscheduledTasks = [], isLoading } = useUnscheduledTasks(
    selectedArea === 'All Areas' ? undefined : selectedArea
  );
  const createTimeBlock = useCreateTimeBlock();

  const [selectedTask, setSelectedTask] = useState<UnscheduledTask | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Store schedule status for each task (we'll populate this via the child components)
  const [taskScheduleStatus, setTaskScheduleStatus] = useState<Record<string, boolean>>({});

  // Filter tasks by date
  const dateFilteredTasks = useMemo(() => {
    if (selectedDateFilter === 'All Tasks') return unscheduledTasks;

    const now = new Date();

    return unscheduledTasks.filter((task) => {
      if (!task.due_date) return false;

      const dueDate = parseISO(task.due_date);

      switch (selectedDateFilter) {
        case 'Due Today':
          return isWithinInterval(dueDate, {
            start: startOfDay(now),
            end: endOfDay(now),
          });
        case 'Due This Week':
          return isWithinInterval(dueDate, {
            start: startOfWeek(now, { weekStartsOn: 1 }),
            end: endOfWeek(now, { weekStartsOn: 1 }),
          });
        case 'Due Next Week':
          const nextWeekStart = startOfWeek(addDays(now, 7), { weekStartsOn: 1 });
          const nextWeekEnd = endOfWeek(addDays(now, 7), { weekStartsOn: 1 });
          return isWithinInterval(dueDate, {
            start: nextWeekStart,
            end: nextWeekEnd,
          });
        case 'Due This Month':
          return isWithinInterval(dueDate, {
            start: startOfMonth(now),
            end: endOfMonth(now),
          });
        default:
          return true;
      }
    });
  }, [unscheduledTasks, selectedDateFilter]);

  // Filter by schedule status
  const filteredTasks = useMemo(() => {
    if (selectedScheduleFilter === 'All Tasks') return dateFilteredTasks;

    return dateFilteredTasks.filter((task) => {
      const isScheduled = taskScheduleStatus[task.task_id] || false;

      if (selectedScheduleFilter === 'Scheduled') return isScheduled;
      if (selectedScheduleFilter === 'Unscheduled') return !isScheduled;
      return true;
    });
  }, [dateFilteredTasks, selectedScheduleFilter, taskScheduleStatus]);

  // Calculate end time
  const endTime = format(
    addMinutes(parseISO(`${scheduledDate}T${startTime}`), durationMinutes),
    'HH:mm'
  );

  // Check conflicts
  const { data: conflicts = [] } = useTimeBlockConflicts(
    parseISO(scheduledDate),
    `${startTime}:00`,
    `${endTime}:00`
  );

  const hasConflicts = conflicts.length > 0;

  const handleScheduleTask = async () => {
    if (!selectedTask) return;

    try {
      await createTimeBlock.mutateAsync({
        taskId: selectedTask.task_id,
        scheduledDate: parseISO(scheduledDate),
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        plannedDurationMinutes: durationMinutes,
      });

      alert(`✓ Scheduled "${selectedTask.task_name}" successfully!`);
      setSelectedTask(null);
      onScheduleComplete?.();
    } catch (error) {
      console.error('Failed to schedule task:', error);
      alert('Failed to schedule task. Please try again.');
    }
  };

  const handleQuickSchedule = (task: UnscheduledTask) => {
    setSelectedTask(task);
    // Set duration based on task estimate (convert hours to minutes)
    const estimatedMinutes = task.hours_remaining > 0
      ? Math.min(task.hours_remaining * 60, 240)
      : 60; // Default to 1 hour if no estimate
    setDurationMinutes(estimatedMinutes);
  };

  const handleScheduleStatusChange = (taskId: string, isScheduled: boolean) => {
    setTaskScheduleStatus(prev => ({ ...prev, [taskId]: isScheduled }));
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="text-gray-400">Loading unscheduled tasks...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-orange-400" />
        <div>
          <h2 className="text-xl font-bold text-gray-100">Task Scheduler</h2>
        </div>
      </div>

      {/* Area Filter */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedArea('All Areas')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedArea === 'All Areas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Areas
          </button>
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors text-white"
              style={{
                backgroundColor: AREA_COLORS[area],
                opacity: selectedArea === area ? 1 : 0.6,
              }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-4">
        <div className="flex gap-2">
          {(['All Tasks', 'Due Today', 'Due This Week', 'Due Next Week', 'Due This Month'] as DateFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedDateFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedDateFilter === filter
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Status Filter */}
      <div className="mb-6">
        <div className="flex gap-2">
          {(['All Tasks', 'Scheduled', 'Unscheduled'] as ScheduleFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedScheduleFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedScheduleFilter === filter
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Unscheduled Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {selectedDateFilter === 'All Tasks' && selectedArea === 'All Areas'
              ? 'All tasks are scheduled!'
              : 'No tasks match the selected filters'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {selectedDateFilter === 'All Tasks' && selectedArea === 'All Areas'
              ? 'Great job staying organized. New tasks will appear here.'
              : 'Try adjusting your filters to see more tasks.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {filteredTasks.map((task) => (
            <DraggableTaskCard
              key={task.task_id}
              task={task}
              isSelected={selectedTask?.task_id === task.task_id}
              onQuickSchedule={handleQuickSchedule}
              onClearSelection={() => setSelectedTask(null)}
              onScheduleStatusChange={handleScheduleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Scheduling Form */}
      {selectedTask && (
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500">
          <h3 className="text-lg font-bold text-gray-100 mb-4">
            Schedule: {selectedTask.task_name}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Date */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                min={15}
                max={480}
                step={15}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
              />
            </div>

            {/* End Time (calculated) */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">End Time</label>
              <div className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-300">
                {endTime}
              </div>
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex gap-2 mb-4">
            <span className="text-sm text-gray-400 my-auto">Quick:</span>
            {[30, 60, 90, 120, 180, 240].map((mins) => (
              <button
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  durationMinutes === mins
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Conflicts Warning */}
          {hasConflicts && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Time Conflict Detected</span>
              </div>
              <div className="text-sm text-gray-300">
                {conflicts.map((conflict, i) => (
                  <div key={i}>
                    • {conflict.task_name} ({conflict.start_time} - {conflict.end_time})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleScheduleTask}
              disabled={hasConflicts || createTimeBlock.isPending}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                hasConflicts || createTimeBlock.isPending
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              {createTimeBlock.isPending ? 'Scheduling...' : 'Schedule Task'}
            </button>
            <button
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
