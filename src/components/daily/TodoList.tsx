import type { FC } from 'react';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { CheckSquare, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { TaskHub } from '../../types/task';
import { TaskCard } from '../tasks/TaskCard';

interface TodoListProps {
  date?: Date;
}

/**
 * TodoList - Daily todo list showing tasks scheduled or due for a specific day
 * Shows both scheduled_date and due_date tasks
 * Real-time sync enabled - updates automatically when tasks are created/modified
 */
export const TodoList: FC<TodoListProps> = ({ date = new Date() }) => {
  const selectedDate = format(date, 'yyyy-MM-dd');
  const tomorrow = format(new Date(date.getTime() + 86400000), 'yyyy-MM-dd');
  const queryClient = useQueryClient();

  // Real-time sync: Listen for task changes and auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel('todo-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('[TodoList Real-time] Task change detected:', payload.eventType);
          // Invalidate all daily task queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['tasks', 'daily'] });
        }
      )
      .subscribe((status) => {
        console.log('[TodoList Real-time] Subscription status:', status);
      });

    return () => {
      console.log('[TodoList Real-time] Unsubscribing from todo-tasks-changes channel');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch today's tasks (scheduled or due today)
  const { data: todayTasks, isLoading: loadingToday } = useQuery({
    queryKey: ['tasks', 'daily', 'today', selectedDate],
    queryFn: async () => {
      console.log('[TodoList] Fetching tasks for date:', selectedDate);
      const { data, error } = await supabase
        .from('tasks')
        .select('*, businesses(name, color), projects(name), phases(name), life_areas(name, color)')
        .or(`scheduled_date.eq.${selectedDate},due_date.eq.${selectedDate}`)
        .order('priority', { ascending: false })
        .order('scheduled_time', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('[TodoList] Query error:', error);
        throw error;
      }

      console.log('[TodoList] Query returned tasks:', data?.length || 0, 'tasks');
      console.log('[TodoList] Task details:', data);
      return data as TaskHub[];
    },
  });

  // Fetch tomorrow's tasks (preview section)
  const { data: tomorrowTasks } = useQuery({
    queryKey: ['tasks', 'daily', 'tomorrow', tomorrow],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, businesses(name, color), projects(name), phases(name), life_areas(name, color)')
        .or(`scheduled_date.eq.${tomorrow},due_date.eq.${tomorrow}`)
        .order('priority', { ascending: false })
        .limit(5); // Show only first 5 tomorrow tasks

      if (error) throw error;
      return data as TaskHub[];
    },
    enabled: isToday(date), // Only fetch tomorrow tasks if viewing today
  });

  // Separate overdue tasks
  const overdueTasks = todayTasks?.filter(t => t.past_due && t.progress_percentage < 100) || [];
  const regularTasks = todayTasks?.filter(t => !t.past_due || t.progress_percentage === 100) || [];

  if (loadingToday) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-100">
            {isToday(date) ? "Today's Tasks" : `Tasks for ${format(date, 'MMM d, yyyy')}`}
          </h2>
          {todayTasks && todayTasks.length > 0 && (
            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-sm rounded">
              {todayTasks.filter(t => t.progress_percentage === 100).length}/{todayTasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => {/* TODO: Implement add task */}}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Overdue Tasks Section */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
              Overdue ({overdueTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Tasks */}
      {regularTasks.length > 0 ? (
        <div className="space-y-2">
          {regularTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : !overdueTasks.length ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
          <CheckSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No tasks for this day</p>
          <p className="text-sm text-gray-500 mt-1">Add tasks to start planning your day</p>
        </div>
      ) : null}

      {/* Tomorrow Preview (only show when viewing today) */}
      {isToday(date) && tomorrowTasks && tomorrowTasks.length > 0 && (
        <div className="pt-6 border-t border-gray-700 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Tomorrow ({tomorrowTasks.length})
          </h3>
          <div className="space-y-2">
            {tomorrowTasks.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
