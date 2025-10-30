/**
 * React Query hook for Daily Streak Tracking
 * Story 2.5: Daily Goals Progress Tracking (Task 8)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';

export interface DailyStreak {
  currentStreak: number; // Consecutive days with >80% completion
  longestStreak: number; // All-time longest streak
  streakActive: boolean; // Whether streak includes today
  last30Days: Array<{ date: string; completionPercent: number }>; // Historical data
}

/**
 * Hook for calculating daily completion streaks
 * A streak day is defined as >80% completion
 */
export function useDailyStreak(): {
  data: DailyStreak | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  return useQuery({
    queryKey: ['daily-completions', 'streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Query tasks for last 30 days
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('tasks')
        .select('due_date, progress_percentage')
        .eq('user_id', user.id)
        .gte('due_date', thirtyDaysAgo)
        .lte('due_date', today);

      if (error) throw error;

      // Group tasks by date and calculate completion percentage
      const completionsByDate: Record<string, { total: number; completed: number }> = {};

      (data || []).forEach(task => {
        if (!task.due_date) return;

        if (!completionsByDate[task.due_date]) {
          completionsByDate[task.due_date] = { total: 0, completed: 0 };
        }

        completionsByDate[task.due_date].total++;
        if (task.progress_percentage === 100) {
          completionsByDate[task.due_date].completed++;
        }
      });

      // Convert to array sorted by date
      const dailyCompletions = Object.entries(completionsByDate)
        .map(([date, stats]) => ({
          date,
          completionPercent: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate current streak (backward from today)
      let currentStreak = 0;
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayCompletion = dailyCompletions.find(d => d.date === date);

        if (dayCompletion && dayCompletion.completionPercent >= 80) {
          currentStreak++;
        } else {
          // Streak broken
          break;
        }
      }

      // Calculate longest streak in the 30-day window
      let longestStreak = 0;
      let tempStreak = 0;

      dailyCompletions.forEach(day => {
        if (day.completionPercent >= 80) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });

      const streakActive = currentStreak > 0;

      return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak), // Ensure current is included
        streakActive,
        last30Days: dailyCompletions,
      } as DailyStreak;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
