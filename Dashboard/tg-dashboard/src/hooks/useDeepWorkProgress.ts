/**
 * React Query hook for Deep Work Progress Tracking
 * Story 2.5: Daily Goals Progress Tracking (Task 4)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useMemo } from 'react';

export interface DeepWorkProgress {
  hoursWorked: number; // Total hours worked today
  hoursGoal: number; // Daily goal (from settings or default 6h)
  deepWorkProgress: number; // Percentage: (hoursWorked / hoursGoal) * 100
  minutesWorked: number; // Raw minutes for calculations
}

/**
 * Hook for fetching daily Deep Work progress
 * Queries deep_work_log for the specified date
 *
 * @param date - Date to calculate progress for (defaults to today)
 */
export function useDeepWorkProgress(date: Date = new Date()): {
  data: DeepWorkProgress | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const dateString = format(date, 'yyyy-MM-dd');
  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();

  // Query deep work sessions for the day
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['deep-work', 'daily', dateString],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('duration_minutes, start_time, end_time')
        .eq('user_id', user.id)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .not('end_time', 'is', null); // Only completed sessions

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // 1 minute
  });

  // Query user settings for daily goal (optional - defaults to 6h if not set)
  // Note: user_preferences table may not exist - that's OK, we use default 6h
  const { data: userSettings } = useQuery({
    queryKey: ['user-settings', 'deep-work-goal'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try to get from user_preferences table (if it exists)
      const { data, error } = await supabase
        .from('user_preferences')
        .select('daily_deep_work_goal_hours')
        .eq('user_id', user.id)
        .maybeSingle();

      // Silently fail if table doesn't exist - use default instead
      if (error) {
        console.debug('user_preferences table not found, using default 6h goal');
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if table doesn't exist
    retryOnMount: false,
  });

  const deepWorkProgress = useMemo<DeepWorkProgress>(() => {
    const minutesWorked = (sessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const hoursWorked = minutesWorked / 60;

    // Get goal from settings or use default 6 hours
    const hoursGoal = userSettings?.daily_deep_work_goal_hours || 6;

    const progressPercentage = hoursGoal > 0 ? (hoursWorked / hoursGoal) * 100 : 0;

    return {
      hoursWorked: Math.round(hoursWorked * 10) / 10, // Round to 1 decimal
      hoursGoal,
      deepWorkProgress: Math.min(100, Math.round(progressPercentage * 10) / 10), // Cap at 100%
      minutesWorked,
    };
  }, [sessions, userSettings]);

  return {
    data: deepWorkProgress,
    isLoading: sessionsLoading,
    error: sessionsError as Error | null,
  };
}
