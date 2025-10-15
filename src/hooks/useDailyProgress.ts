/**
 * React Query hook for Daily Progress Tracking
 * Story 2.5: Daily Goals Progress Tracking
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useMemo } from 'react';

export interface DailyProgress {
  dailyProgress: number | null; // Overall completion % for today
  completedCount: number; // Tasks at 100%
  totalCount: number; // Total tasks due today
  dueTodayCount: number; // Same as totalCount (for consistency)
  date: string; // YYYY-MM-DD format
}

/**
 * Hook for fetching and calculating daily progress metrics
 * Queries tasks with due_date = specified date (defaults to today)
 *
 * @param date - Date to calculate progress for (defaults to today)
 */
export function useDailyProgress(date: Date = new Date()): {
  data: DailyProgress | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const dateString = format(date, 'yyyy-MM-dd');

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', 'daily', dateString],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('id, progress_percentage, due_date, task_name')
        .eq('user_id', user.id)
        .eq('due_date', dateString);

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // 1 minute
  });

  const dailyProgress = useMemo<DailyProgress>(() => {
    if (tasks.length === 0) {
      return {
        dailyProgress: null, // null indicates no tasks for today
        completedCount: 0,
        totalCount: 0,
        dueTodayCount: 0,
        date: dateString,
      };
    }

    const completedCount = tasks.filter(t => t.progress_percentage === 100).length;
    const totalCount = tasks.length;
    const progressPercentage = (completedCount / totalCount) * 100;

    return {
      dailyProgress: Math.round(progressPercentage * 10) / 10, // Round to 1 decimal
      completedCount,
      totalCount,
      dueTodayCount: totalCount,
      date: dateString,
    };
  }, [tasks, dateString]);

  return {
    data: dailyProgress,
    isLoading,
    error: error as Error | null,
  };
}
