import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AreaTimeStats {
  area: string;
  total_hours: number;
  hours_this_week: number;
  hours_this_month: number;
  hours_last_week: number;
  avg_hours_per_week: number;
  last_session_date: string | null;
  days_since_last: number;
}

/**
 * Hook to fetch time statistics for a specific area
 *
 * @param area - The life area to fetch stats for
 * @returns React Query result with area time statistics
 */
export const useAreaTimeStats = (area: string) => {
  return useQuery({
    queryKey: ['area-time-stats', area],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_area_time_stats', {
        p_user_id: user.id,
        p_area: area,
      });

      if (error) throw error;
      return data as AreaTimeStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch time statistics for all 7 areas in a single optimized query
 *
 * @returns React Query result with all areas' time statistics
 */
export const useAllAreasTimeStats = () => {
  return useQuery({
    queryKey: ['all-areas-time-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_all_areas_time_stats', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as AreaTimeStats[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export interface AreaTimeTrendDataPoint {
  date: string;
  area: string;
  hours: number;
}

/**
 * Hook to fetch historical time trend data for line charts
 *
 * @param days - Number of days to look back (default: 90)
 * @returns React Query result with historical time trend data
 */
export const useAreaTimeTrend = (days: number = 90) => {
  return useQuery({
    queryKey: ['area-time-trend', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_area_time_trend', {
        p_user_id: user.id,
        p_days: days,
      });

      if (error) throw error;
      return data as AreaTimeTrendDataPoint[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export interface AreaLabelBreakdownItem {
  area: string;
  label: string;
  hours: number;
  session_count: number;
}

/**
 * Hook to fetch label breakdown by area
 *
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns React Query result with label breakdown data
 */
export const useAreaLabelBreakdown = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['area-label-breakdown', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_area_label_breakdown', {
        p_user_id: user.id,
        p_start_date: startDate ? startDate.toISOString().split('T')[0] : null,
        p_end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      });

      if (error) throw error;
      return data as AreaLabelBreakdownItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
