import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { DeepWorkTimer } from './DeepWorkTimer';
import { DailySchedulePanel } from './DailySchedulePanel';
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
  const [businessFilter, setBusinessFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID for real-time sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Enable real-time sync
  useRealtimeSync(userId);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return filterTasks(tasks, businessFilter, statusFilter);
  }, [tasks, businessFilter, statusFilter]);

  // Filter scheduled tasks (tasks with scheduled_date)
  const scheduledTasks = useMemo(() => {
    return tasks?.filter((task) => task.scheduled_date) || [];
  }, [tasks]);

  // Handle drop - update task's scheduled_date and scheduled_time
  const handleTaskDrop = async (taskId: string, date: string, time: string) => {
    try {
      console.log('Dropping task:', { taskId, date, time });

      const { data, error } = await supabase
        .from('tasks')
        .update({
          scheduled_date: date,
          scheduled_time: time,
        })
        .eq('id', taskId)
        .select();

      if (error) throw error;
      console.log('Task scheduled successfully:', data);
    } catch (err) {
      console.error('Failed to schedule task:', err);
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
      <div className="p-6">
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
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Tasks Hub</h1>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Failed to load tasks: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-100">Tasks Hub</h1>
        <div className="text-sm text-gray-400">
          {filteredTasks.length} of {tasks?.length || 0} tasks
        </div>
      </div>

      <TaskFilters
        selectedBusiness={businessFilter}
        selectedStatus={statusFilter}
        onBusinessChange={setBusinessFilter}
        onStatusChange={setStatusFilter}
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

        {/* Right sidebar: Deep Work Timer + Schedule */}
        <div className="space-y-6">
          <DeepWorkTimer tasks={tasks || []} />
          <DailySchedulePanel
            scheduledTasks={scheduledTasks}
            onSaveSchedule={handleSaveSchedule}
            onTaskDrop={handleTaskDrop}
            className="h-[1200px]"
          />
        </div>
      </div>
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
