import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useCreateTimeBlock, useDeleteTimeBlock } from '../../hooks/useCalendar';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { DailySchedulePanel } from './DailySchedulePanel';
import { AddTaskModal } from './AddTaskModal';
import type { TaskHub } from '../../types/task';
import { parseISO, addMinutes, format as formatDate } from 'date-fns';
import { parseLocalDate, getTodayMidnight } from '../../utils/dateHelpers';

/**
 * Filter tasks by business/area and status
 */
const filterTasks = (
  tasks: TaskHub[],
  businessFilter: string | null,
  statusFilter: string | null
): TaskHub[] => {
  return tasks.filter((task) => {
    // Business/Area filter
    if (businessFilter) {
      const matchesBusiness = task.businesses?.slug === businessFilter;
      const matchesLifeArea = task.life_areas?.category.toLowerCase() === businessFilter;
      const matchesLegacyArea = task.area?.toLowerCase().replace(' ', '-') === businessFilter;

      if (!matchesBusiness && !matchesLifeArea && !matchesLegacyArea) {
        return false;
      }
    }

    // Status filter
    if (statusFilter) {
      const today = getTodayMidnight();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      if (statusFilter === 'due-today') {
        // Exclude completed tasks from "Due Today"
        if (task.status === 'Done') return false;
        const dueDate = task.due_date ? parseLocalDate(task.due_date) : null;
        if (!dueDate) return false;
        const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0);
        if (dueDateMidnight.getTime() < today.getTime() || dueDateMidnight.getTime() >= tomorrow.getTime()) return false;
      }

      if (statusFilter === 'completed-today') {
        const completedDate = task.completed_at ? new Date(task.completed_at) : null;
        if (!completedDate) return false;
        const completedMidnight = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate(), 0, 0, 0, 0);
        if (completedMidnight.getTime() < today.getTime() || completedMidnight.getTime() >= tomorrow.getTime()) return false;
      }

      if (statusFilter === 'due-tomorrow') {
        // Exclude completed tasks from "Due Tomorrow"
        if (task.status === 'Done') return false;
        const dueDate = task.due_date ? parseLocalDate(task.due_date) : null;
        if (!dueDate) return false;
        const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0);
        if (dueDateMidnight.getTime() < tomorrow.getTime() || dueDateMidnight.getTime() >= dayAfterTomorrow.getTime()) return false;
      }

      if (statusFilter === 'overdue') {
        if (task.status === 'Done') return false;
        const dueDate = task.due_date ? parseLocalDate(task.due_date) : null;
        if (!dueDate) return false;
        const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0, 0);
        if (dueDateMidnight.getTime() >= today.getTime()) return false;
      }

      if (statusFilter === 'active' && task.status === 'Done') return false;

      if (statusFilter === 'completed' && task.status !== 'Done') return false;

      if (statusFilter === 'recurring') {
        // Show only parent recurring tasks (templates) - no due_date and no parent link
        const isRecurringParent = !task.due_date && !task.recurring_parent_id;
        if (!isRecurringParent) return false;
      }
    }

    return true;
  });
};

export const TasksHub: FC = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const createTimeBlock = useCreateTimeBlock();
  const deleteTimeBlock = useDeleteTimeBlock();
  const [businessFilter, setBusinessFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>('due-today');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());

  // Get current user ID for real-time sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Enable real-time sync
  useRealtimeSync(userId);

  // Fetch all time blocks for sorting
  const { data: allTimeBlocks = [] } = useQuery({
    queryKey: ['all-time-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_time_blocks')
        .select('task_id, scheduled_date, start_time')
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching time blocks:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 30000, // 30 seconds
  });

  // Filter tasks based on selected filters and sort by scheduled date/time, then due date
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const filtered = filterTasks(tasks, businessFilter, statusFilter);

    // Filter to selected schedule date's time blocks for sorting
    const scheduleDateStr = formatDate(scheduleDate, 'yyyy-MM-dd');
    const todaysTimeBlocks = allTimeBlocks.filter(block => block.scheduled_date === scheduleDateStr);

    // Create a map of task_id to earliest time block for today
    const timeBlockMap = new Map<string, { scheduled_date: string; start_time: string }>();
    todaysTimeBlocks.forEach((block) => {
      if (!timeBlockMap.has(block.task_id)) {
        timeBlockMap.set(block.task_id, {
          scheduled_date: block.scheduled_date,
          start_time: block.start_time,
        });
      }
    });

    // Sort by: 1) scheduled date/time (if exists), 2) due date (if exists), 3) created date
    return filtered.sort((a, b) => {
      const aTimeBlock = timeBlockMap.get(a.id);
      const bTimeBlock = timeBlockMap.get(b.id);

      // If both have time blocks, sort by scheduled date/time
      if (aTimeBlock && bTimeBlock) {
        const dateCompare = aTimeBlock.scheduled_date.localeCompare(bTimeBlock.scheduled_date);
        if (dateCompare !== 0) return dateCompare;
        return aTimeBlock.start_time.localeCompare(bTimeBlock.start_time);
      }

      // Tasks with time blocks come before tasks without
      if (aTimeBlock && !bTimeBlock) return -1;
      if (!aTimeBlock && bTimeBlock) return 1;

      // If neither has time blocks, sort by due date
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      const dateA = parseLocalDate(a.due_date);
      const dateB = parseLocalDate(b.due_date);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  }, [tasks, businessFilter, statusFilter, allTimeBlocks, scheduleDate]);

  // Handle drop - create time block
  const handleTaskDrop = async (taskId: string, date: string, time: string) => {
    try {
      // Calculate end time (1 hour after start)
      const startTime = `${time}:00`; // HH:MM:SS format
      const endTime = formatDate(
        addMinutes(parseISO(`${date}T${time}`), 60),
        'HH:mm:ss'
      );

      await createTimeBlock.mutateAsync({
        taskId,
        scheduledDate: parseISO(date),
        startTime,
        endTime,
        plannedDurationMinutes: 60,
      });

      console.log('✅ Task scheduled to time block:', { taskId, date, time });
    } catch (err) {
      console.error('❌ Failed to schedule task:', err);
      alert('Failed to schedule task. Please try again.');
    }
  };

  // Handle remove - delete time block
  const handleBlockRemove = async (blockId: string) => {
    try {
      await deleteTimeBlock.mutateAsync(blockId);
      console.log('✅ Time block removed:', blockId);
    } catch (err) {
      console.error('❌ Failed to remove time block:', err);
      alert('Failed to remove time block. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 px-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Tasks Hub</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-800 h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 px-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Tasks Hub</h1>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Failed to load tasks: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 px-4 sm:px-8 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Tasks</h1>
        <button
          onClick={() => setIsAddTaskModalOpen(true)}
          className="px-4 sm:px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base touch-action-none"
        >
          <span className="text-xl leading-none">+</span>
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <TaskFilters
        selectedBusiness={businessFilter}
        selectedStatus={statusFilter}
        onBusinessChange={setBusinessFilter}
        onStatusChange={setStatusFilter}
        tasks={tasks || []}
      />

      {/* Two-column layout: Main content + Right sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,500px] 2xl:grid-cols-[1fr,550px] gap-3 sm:gap-4 mt-4 sm:mt-6">
        {/* Left column: Task cards */}
        <div className="min-w-0">
          {filteredTasks.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-gray-400">
                {tasks && tasks.length > 0
                  ? 'No tasks match the selected filters.'
                  : 'No tasks found. Create your first task to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredTasks.map((task) => (
                <DraggableTaskCard key={task.id} task={task} scheduleDate={scheduleDate} />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Schedule */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <DailySchedulePanel
            onTaskDrop={handleTaskDrop}
            onBlockRemove={handleBlockRemove}
            onDateChange={setScheduleDate}
            className="h-[calc(100vh-200px)] sm:h-[calc(100vh-120px)] xl:h-[calc(100vh-80px)]"
          />
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSuccess={() => {
          // Modal will close automatically on success
          console.log('✅ Task created successfully');
        }}
      />
    </div>
  );
};

// Wrapper to make TaskCard draggable
interface DraggableTaskCardProps {
  task: TaskHub;
  scheduleDate: Date;
}

const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task, scheduleDate }) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('task', JSON.stringify(task));
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      style={{ cursor: 'grab' }}
    >
      <TaskCard task={task} scheduleDate={scheduleDate} />
    </div>
  );
};
