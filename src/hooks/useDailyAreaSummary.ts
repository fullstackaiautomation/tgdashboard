// Story 5.2: Daily Area Summary Hook
// Fetches comprehensive daily metrics for enhanced Daily card

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { calculateDailyProgress, type DailyProgressResult } from '../utils/dailyProgressCalculator';

export interface DailyAreaSummary {
  // Task metrics
  tasksDueToday: number;
  tasksCompletedToday: number;
  tasksOverdue: number;
  tasksDueTomorrow: number;
  dailyCompletionPercentage: number;

  // Deep Work metrics
  deepWorkHoursToday: number;
  deepWorkTargetHours: number;
  deepWorkProgress: number; // percentage

  // Last session info
  lastSessionArea: string | null;
  lastSessionDuration: number | null;
  lastSessionTimeAgo: string | null;

  // Next scheduled item
  nextScheduledTask: string | null;
  nextScheduledTime: string | null;
  nextScheduledTimeFormatted: string | null;
  nextScheduledArea: string | null;

  // Progress tracking
  progressResult: DailyProgressResult;
}

interface RawDailySummary {
  tasks_due_today: number;
  tasks_completed_today: number;
  tasks_overdue: number;
  tasks_due_tomorrow: number;
  daily_completion_percentage: number;
  deep_work_hours_today: number;
  deep_work_target_hours: number;
  last_session_area: string | null;
  last_session_duration: number | null;
  last_session_start: string | null;
  next_scheduled_task: string | null;
  next_scheduled_time: string | null;
  next_scheduled_area: string | null;
}

/**
 * Hook to fetch Daily area summary with comprehensive metrics
 * Implements Task 1, 2, 4 from Story 5.2
 */
export const useDailyAreaSummary = () => {
  return useQuery<DailyAreaSummary, Error>({
    queryKey: ['daily', 'area-summary'],
    queryFn: async () => {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Authentication failed');
      if (!user) throw new Error('Not authenticated');

      // Call aggregation function
      const { data, error } = await supabase.rpc('get_daily_area_summary', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Daily area summary query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        // Return empty summary if no data
        const progressResult = calculateDailyProgress(0);
        return {
          tasksDueToday: 0,
          tasksCompletedToday: 0,
          tasksOverdue: 0,
          tasksDueTomorrow: 0,
          dailyCompletionPercentage: 0,
          deepWorkHoursToday: 0,
          deepWorkTargetHours: 6,
          deepWorkProgress: 0,
          lastSessionArea: null,
          lastSessionDuration: null,
          lastSessionTimeAgo: null,
          nextScheduledTask: null,
          nextScheduledTime: null,
          nextScheduledTimeFormatted: null,
          nextScheduledArea: null,
          progressResult,
        };
      }

      const raw = data[0] as RawDailySummary;

      // Calculate progress result with time-of-day expectations
      const progressResult = calculateDailyProgress(raw.daily_completion_percentage || 0);

      // Format last session time
      const lastSessionTimeAgo = raw.last_session_start
        ? formatDistanceToNow(new Date(raw.last_session_start), { addSuffix: true })
        : null;

      // Format next scheduled time
      const nextScheduledTimeFormatted = raw.next_scheduled_time
        ? formatScheduledTime(raw.next_scheduled_time)
        : null;

      // Calculate deep work progress
      const deepWorkProgress = raw.deep_work_target_hours > 0
        ? Math.round((raw.deep_work_hours_today / raw.deep_work_target_hours) * 100)
        : 0;

      return {
        tasksDueToday: raw.tasks_due_today,
        tasksCompletedToday: raw.tasks_completed_today,
        tasksOverdue: raw.tasks_overdue,
        tasksDueTomorrow: raw.tasks_due_tomorrow,
        dailyCompletionPercentage: raw.daily_completion_percentage || 0,
        deepWorkHoursToday: raw.deep_work_hours_today || 0,
        deepWorkTargetHours: raw.deep_work_target_hours || 6,
        deepWorkProgress,
        lastSessionArea: raw.last_session_area,
        lastSessionDuration: raw.last_session_duration,
        lastSessionTimeAgo,
        nextScheduledTask: raw.next_scheduled_task,
        nextScheduledTime: raw.next_scheduled_time,
        nextScheduledTimeFormatted,
        nextScheduledArea: raw.next_scheduled_area,
        progressResult,
      };
    },
    // Aggressive caching for real-time feel
    staleTime: 30000, // 30 seconds - refresh frequently for "today" data
    gcTime: 60000, // 1 minute
    refetchInterval: 60000, // Auto-refetch every minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Format time string (e.g., "14:30:00" → "2:30 PM")
 */
const formatScheduledTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};
