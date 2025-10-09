import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import type { TaskHub } from '../../types/task';

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
      if (statusFilter === 'active' && task.status !== 'Not started') return false;
      if (statusFilter === 'in-progress' && task.status !== 'In progress') return false;
      if (statusFilter === 'done' && task.status !== 'Done') return false;
      if (statusFilter === 'overdue') {
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done';
        if (!isOverdue) return false;
      }
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
    <div className="p-6">
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
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
