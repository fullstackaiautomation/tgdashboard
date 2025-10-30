/**
 * useCalendar - React Query hooks for calendar and task scheduling operations
 *
 * Provides hooks for:
 * - Fetching calendar views (day, week, month)
 * - Managing task time blocks (create, update, delete)
 * - Getting unscheduled tasks
 * - Checking time conflicts
 * - Analytics on scheduled vs actual time
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type {
  TaskTimeBlock,
  CalendarViewBlock,
  DailyScheduleBlock,
  WeeklyCalendarSummary,
  UnscheduledTask,
  TimeBlockConflict,
  TaskSchedulingAnalytics,
  TimeBlockStatus,
} from '@/types/calendar';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get calendar view for a date range
 */
export const useCalendarView = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['calendar-view', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_calendar_view', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as CalendarViewBlock[]) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
};

/**
 * Get daily schedule for a specific date
 */
export const useDailySchedule = (date: Date) => {
  return useQuery({
    queryKey: ['daily-schedule', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_daily_schedule', {
        p_user_id: user.id,
        p_date: format(date, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as DailyScheduleBlock[]) || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 1 * 60 * 1000,
  });
};

/**
 * Get weekly calendar summary
 */
export const useWeeklyCalendarSummary = (weekStart: Date) => {
  return useQuery({
    queryKey: ['weekly-calendar-summary', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_weekly_calendar_summary', {
        p_user_id: user.id,
        p_week_start: format(weekStart, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as WeeklyCalendarSummary[]) || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

/**
 * Get unscheduled tasks (tasks that need time blocks assigned)
 */
export const useUnscheduledTasks = (area?: string) => {
  return useQuery({
    queryKey: ['unscheduled-tasks', area],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('[useUnscheduledTasks] Fetching for user:', user.id, 'area:', area);

      const { data, error } = await supabase.rpc('get_unscheduled_tasks', {
        p_user_id: user.id,
        p_area: area || null,
      });

      if (error) {
        console.error('[useUnscheduledTasks] Error:', error);
        throw error;
      }

      console.log('[useUnscheduledTasks] Received data:', data);
      return (data as UnscheduledTask[]) || [];
    },
    staleTime: 1 * 60 * 1000,
    refetchInterval: 1 * 60 * 1000,
  });
};

/**
 * Check for time block conflicts
 */
export const useTimeBlockConflicts = (
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  excludeBlockId?: string
) => {
  return useQuery({
    queryKey: [
      'time-block-conflicts',
      format(scheduledDate, 'yyyy-MM-dd'),
      startTime,
      endTime,
      excludeBlockId,
    ],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('check_time_block_conflicts', {
        p_user_id: user.id,
        p_scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_block_id: excludeBlockId || null,
      });

      if (error) throw error;
      return (data as TimeBlockConflict[]) || [];
    },
    enabled: !!startTime && !!endTime, // Only run if times are provided
  });
};

/**
 * Get task scheduling analytics
 */
export const useTaskSchedulingAnalytics = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: [
      'task-scheduling-analytics',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_task_scheduling_analytics', {
        p_user_id: user.id,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as TaskSchedulingAnalytics[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new task time block
 */
export const useCreateTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      scheduledDate: Date;
      startTime: string;
      endTime: string;
      plannedDurationMinutes: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('task_time_blocks')
        .insert({
          user_id: user.id,
          task_id: params.taskId,
          scheduled_date: format(params.scheduledDate, 'yyyy-MM-dd'),
          start_time: params.startTime,
          end_time: params.endTime,
          planned_duration_minutes: params.plannedDurationMinutes,
          notes: params.notes || null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeBlock;
    },
    onSuccess: () => {
      // Invalidate all calendar-related queries
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-calendar-summary'] });
      queryClient.invalidateQueries({ queryKey: ['unscheduled-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-time-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['task-has-time-blocks'] });
    },
  });
};

/**
 * Update a task time block
 */
export const useUpdateTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      blockId: string;
      updates: Partial<{
        scheduled_date: string;
        start_time: string;
        end_time: string;
        planned_duration_minutes: number;
        actual_duration_minutes: number | null;
        status: TimeBlockStatus;
        notes: string | null;
      }>;
    }) => {
      const { data, error } = await supabase
        .from('task_time_blocks')
        .update(params.updates)
        .eq('id', params.blockId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-calendar-summary'] });
      queryClient.invalidateQueries({ queryKey: ['task-scheduling-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['task-time-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['task-has-time-blocks'] });
    },
  });
};

/**
 * Delete a task time block
 */
export const useDeleteTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('task_time_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-calendar-summary'] });
      queryClient.invalidateQueries({ queryKey: ['unscheduled-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-time-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['task-has-time-blocks'] });
    },
  });
};

/**
 * Mark time block as completed (and record actual duration)
 */
export const useCompleteTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { blockId: string; actualDurationMinutes: number }) => {
      const { data, error } = await supabase
        .from('task_time_blocks')
        .update({
          status: 'completed',
          actual_duration_minutes: params.actualDurationMinutes,
        })
        .eq('id', params.blockId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['task-scheduling-analytics'] });
    },
  });
};

/**
 * Start a time block (mark as in_progress)
 */
export const useStartTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const { data, error } = await supabase
        .from('task_time_blocks')
        .update({ status: 'in_progress' })
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
    },
  });
};

/**
 * Cancel a time block
 */
export const useCancelTimeBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      const { data, error } = await supabase
        .from('task_time_blocks')
        .update({ status: 'cancelled' })
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeBlock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-view'] });
      queryClient.invalidateQueries({ queryKey: ['daily-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['unscheduled-tasks'] });
    },
  });
};
