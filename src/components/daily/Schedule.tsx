import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday } from 'date-fns';
import { Clock, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { TaskHub } from '../../types/task';
import { TaskCard } from '../tasks/TaskCard';

interface ScheduleProps {
  date?: Date;
}

/**
 * Schedule - Daily schedule view showing time-scheduled tasks
 * Displays tasks with scheduled_time in chronological order
 */
export const Schedule: FC<ScheduleProps> = ({ date = new Date() }) => {
  const selectedDate = format(date, 'yyyy-MM-dd');

  // Fetch tasks scheduled for this date with time
  const { data: scheduledTasks, isLoading } = useQuery({
    queryKey: ['tasks', 'schedule', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, businesses(name, color), projects(name), phases(name), life_areas(name, color)')
        .eq('scheduled_date', selectedDate)
        .not('scheduled_time', 'is', null)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data as TaskHub[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-100">
            {isToday(date) ? "Today's Schedule" : `Schedule for ${format(date, 'MMM d, yyyy')}`}
          </h2>
        </div>
        <button
          onClick={() => {/* TODO: Implement add task */}}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Scheduled Tasks */}
      {scheduledTasks && scheduledTasks.length > 0 ? (
        <div className="space-y-3">
          {scheduledTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3">
              {/* Time Label */}
              <div className="flex-shrink-0 w-20 text-right">
                <span className="text-sm font-medium text-gray-400">
                  {task.scheduled_time ? format(new Date(`2000-01-01T${task.scheduled_time}`), 'h:mm a') : '—'}
                </span>
              </div>

              {/* Task Card */}
              <div className="flex-1">
                <TaskCard task={task} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No scheduled tasks for this day</p>
          <p className="text-sm text-gray-500 mt-1">Add tasks with specific times to build your schedule</p>
        </div>
      )}
    </div>
  );
};
