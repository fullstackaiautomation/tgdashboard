import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HealthTimeStats {
  hours_today: number;
  hours_this_week: number;
  hours_last_week: number;
  target_daily_hours: number;
  target_weekly_hours: number;
  daily_percentage: number;
  weekly_percentage: number;
  weekly_delta: number;
  weekly_delta_percentage: number;
  hours_below_target: number;
}

export interface HealthNeglectRisk {
  risk_level: 'none' | 'low' | 'high';
  weeks_below_50: number;
  consecutive_below: number;
  target_weekly: number;
  threshold: number;
}

export interface HealthActivity {
  activity: string;
  hours: number;
  session_count: number;
  percentage: number;
}

export interface WeeklyHealthSummary {
  week_start: string;
  week_number: number;
  hours: number;
  target_hours: number;
  met_target: boolean;
  percentage: number;
}

/**
 * Hook to fetch comprehensive health time statistics
 * Refetches every minute to keep data fresh
 */
export const useHealthTimeStats = () => {
  return useQuery({
    queryKey: ['health-time-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_health_time_stats', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as HealthTimeStats;
    },
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Hook to calculate consecutive weeks meeting health target
 * Stale time 1 hour as streaks don't change frequently
 */
export const useHealthTimeStreak = () => {
  return useQuery({
    queryKey: ['health-time-streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_health_time_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as number;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook to detect health neglect risk
 * Refetches every 5 minutes to monitor for alerts
 */
export const useHealthNeglectRisk = () => {
  return useQuery({
    queryKey: ['health-neglect-risk'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('detect_health_neglect_risk', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as HealthNeglectRisk;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get health activity breakdown by labels
 * @param days - Number of days to look back (default: 7)
 */
export const useHealthActivityBreakdown = (days: number = 7) => {
  return useQuery({
    queryKey: ['health-activity-breakdown', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_health_activity_breakdown', {
        p_user_id: user.id,
        p_days: days,
      });

      if (error) throw error;
      return data as HealthActivity[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get weekly health summary for last N weeks
 * @param weeks - Number of weeks to look back (default: 4)
 */
export const useWeeklyHealthSummary = (weeks: number = 4) => {
  return useQuery({
    queryKey: ['weekly-health-summary', weeks],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_weekly_health_summary', {
        p_user_id: user.id,
        p_weeks: weeks,
      });

      if (error) throw error;
      return data as WeeklyHealthSummary[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
