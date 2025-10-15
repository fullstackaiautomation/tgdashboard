/**
 * useTimeAnalytics - React Query hooks for Time Analytics Dashboard (Story 4.4)
 *
 * Hooks for fetching visual analytics data:
 * - Weekly heatmap
 * - Area distribution (pie chart)
 * - Task type breakdown
 * - Time allocation trends
 * - Focus time metrics
 * - Peak productivity hours
 * - Label analysis
 * - Week-over-week comparison
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfWeek, subWeeks, format } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface WeeklyHeatmapData {
  day_date: string;
  area: string;
  hours: number;
}

export interface AreaDistributionData {
  area: string;
  hours: number;
  percentage: number;
}

export interface TaskTypeDistributionData {
  task_type: string;
  hours: number;
  percentage: number;
  session_count: number;
}

export interface TrendData {
  date: string;
  area: string;
  hours: number;
}

export interface FocusTimeData {
  tracked_hours: number;
  available_hours: number;
  focus_percentage: number;
}

export interface PeakProductivityData {
  hour_of_day: number;
  session_count: number;
  total_hours: number;
}

export interface LabelAnalysisData {
  label: string;
  session_count: number;
  total_hours: number;
  percentage: number;
}

export interface WeekComparisonData {
  area: string;
  current_week_hours: number;
  last_week_hours: number;
  delta_hours: number;
  delta_percentage: number;
}

/**
 * useWeeklyHeatmap - Fetch weekly heatmap data for a given week
 */
export const useWeeklyHeatmap = (weekStart: Date) => {
  return useQuery({
    queryKey: ['weekly-heatmap', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_weekly_heatmap', {
        p_user_id: user.id,
        p_week_start: format(weekStart, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as WeeklyHeatmapData[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useAreaDistribution - Fetch area distribution (pie chart data)
 */
export const useAreaDistribution = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['area-distribution', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_area_distribution', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as AreaDistributionData[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useTaskTypeDistribution - Fetch task type breakdown
 */
export const useTaskTypeDistribution = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['task-type-distribution', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_task_type_distribution', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as TaskTypeDistributionData[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useTimeAllocationTrend - Fetch time allocation trend over a date range
 */
export const useTimeAllocationTrend = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['time-allocation-trend', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_time_allocation_trend', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as TrendData[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useFocusTimeMetric - Calculate focus time percentage
 */
export const useFocusTimeMetric = (dateRange: DateRange, hoursPerDay = 8, workDaysPerWeek = 5) => {
  return useQuery({
    queryKey: ['focus-time-metric', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd'), hoursPerDay, workDaysPerWeek],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_focus_time_metric', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
        p_hours_per_day: hoursPerDay,
        p_work_days_per_week: workDaysPerWeek,
      });

      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as FocusTimeData | null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * usePeakProductivity - Fetch peak productivity hours
 */
export const usePeakProductivity = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['peak-productivity', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_peak_productivity', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as PeakProductivityData[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useLabelAnalysis - Fetch label-based time breakdown
 */
export const useLabelAnalysis = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['label-analysis', format(dateRange.start, 'yyyy-MM-dd'), format(dateRange.end, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_label_analysis', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as LabelAnalysisData[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useWeekComparison - Compare current week vs last week
 */
export const useWeekComparison = () => {
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const lastWeekStart = subWeeks(currentWeekStart, 1);

  return useQuery({
    queryKey: ['week-comparison', format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_week_comparison', {
        p_user_id: user.id,
        p_current_week_start: format(currentWeekStart, 'yyyy-MM-dd'),
        p_last_week_start: format(lastWeekStart, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as WeekComparisonData[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
