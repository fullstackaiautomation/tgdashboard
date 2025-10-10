import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { DailySchedulePanel } from './DailySchedulePanel';
import { AddTaskModal } from './AddTaskModal';
import type { TaskHub } from '../../types/task';
import { format } from 'date-fns';

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      if (statusFilter === 'due-today') {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        if (!dueDate || dueDate < today || dueDate >= tomorrow) return false;
      }

      if (statusFilter === 'completed-today') {
        const completedDate = task.completed_at ? new Date(task.completed_at) : null;
        if (!completedDate || completedDate < today || completedDate >= tomorrow) return false;
      }

      if (statusFilter === 'due-tomorrow') {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        if (!dueDate || dueDate < tomorrow || dueDate >= dayAfterTomorrow) return false;
      }

      if (statusFilter === 'overdue') {
        const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== 'Done';
        if (!isOverdue) return false;
      }

      if (statusFilter === 'active' && task.status === 'Done') return false;

      if (statusFilter === 'completed' && task.status !== 'Done') return false;

      if (statusFilter === 'recurring' && !task.is_recurring_template) return false;
    }

    return true;
  });
};

export const TasksHub: FC = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const updateTaskMutation = useUpdateTask();
  const [businessFilter, setBusinessFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>('due-today');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Get current user ID for real-time sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Enable real-time sync
  useRealtimeSync(userId);

  // Filter tasks based on selected filters and sort by due date ascending
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const filtered = filterTasks(tasks, businessFilter, statusFilter);

    // Sort by due date ascending (earliest first)
    return filtered.sort((a, b) => {
      // Tasks without due dates go to the end
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      // Compare due dates
      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      return dateA - dateB;
    });
  }, [tasks, businessFilter, statusFilter]);

  // Filter scheduled tasks (tasks with scheduled_date)
  const scheduledTasks = useMemo(() => {
    return tasks?.filter((task) => task.scheduled_date) || [];
  }, [tasks]);

  // Handle drop - update task's scheduled_date and scheduled_time
  const handleTaskDrop = async (taskId: string, date: string, time: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        updates: {
          scheduled_date: date,
          scheduled_time: time,
        },
        skipConflictCheck: true,
      });

      console.log('✅ Task scheduled successfully:', { taskId, date, time });
    } catch (err) {
      console.error('❌ Failed to schedule task:', err);
    }
  };

  // Handle remove - clear task's scheduled_date and scheduled_time
  const handleTaskRemove = async (taskId: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        updates: {
          scheduled_date: null,
          scheduled_time: null,
        },
        skipConflictCheck: true,
      });
    } catch (err) {
      console.error('Failed to remove task from schedule:', err);
    }
  };

  // Save schedule to schedule_log table
  const handleSaveSchedule = async (date: Date, schedule: Record<string, string[]>) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('schedule_log').upsert({
        user_id: userId,
        log_date: format(date, 'yyyy-MM-dd'),
        scheduled_tasks: schedule,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save schedule:', err);
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
    <div className="py-6 px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Tasks</h1>
        <button
          onClick={() => setIsAddTaskModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span>
          Add Task
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,560px] gap-6 mt-6">
        {/* Left column: Task cards */}
        <div>
          {filteredTasks.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">
                {tasks && tasks.length > 0
                  ? 'No tasks match the selected filters.'
                  : 'No tasks found. Create your first task to get started!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <DraggableTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: Schedule */}
        <div className="space-y-6">
          <DailySchedulePanel
            scheduledTasks={scheduledTasks}
            onSaveSchedule={handleSaveSchedule}
            onTaskDrop={handleTaskDrop}
            onTaskRemove={handleTaskRemove}
            className="h-[1200px]"
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
}

const DraggableTaskCard: FC<DraggableTaskCardProps> = ({ task }) => {
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
      <TaskCard task={task} />
    </div>
  );
};
