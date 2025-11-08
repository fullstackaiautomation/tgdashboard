/**
 * useDeepWorkInsights - React Query hooks for Deep Work Insights (Story 4.6)
 *
 * Hooks for session analytics, focus quality, completion rates, streaks, and recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface SessionAnalytics {
  total_sessions: number;
  avg_session_length_minutes: number;
  median_session_length_minutes: number;
  longest_session_minutes: number;
  shortest_session_minutes: number;
  total_deep_work_hours: number;
  avg_sessions_per_day: number;
  session_length_distribution: {
    under_30min: number;
    '30_to_60min': number;
    '60_to_90min': number;
    '90_to_120min': number;
    over_120min: number;
  };
}

export interface InterruptionAnalysis {
  total_sessions: number;
  interrupted_sessions: number;
  interruption_rate: number;
  reasons: Record<string, number>;
}

export interface OptimalSessionLength {
  duration_bucket: string;
  session_count: number;
  avg_completion_rate: number;
  avg_quality_rating: number;
}

export interface ProductivityRecommendation {
  type: string;
  area?: string;
  time_period?: string;
  completion_rate?: number;
  avg_switches?: number;
  message: string;
}

export interface ContextSwitchingCost {
  focused_days: {
    count: number;
    avg_hours: number;
    avg_completion_rate: number;
  };
  fragmented_days: {
    count: number;
    avg_hours: number;
    avg_completion_rate: number;
  };
  total_switching_cost_minutes: number;
}

/**
 * useSessionAnalytics - Fetch comprehensive session analytics
 */
export const useSessionAnalytics = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['session-analytics', dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_session_analytics', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data as SessionAnalytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useFocusQualityScore - Calculate planned vs. reactive work ratio
 */
export const useFocusQualityScore = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['focus-quality', dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_focus_quality_score', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data as number;
    },
  });
};

/**
 * useCompletionRate - Calculate goal achievement rate
 */
export const useCompletionRate = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['completion-rate', dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_completion_rate', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data as number | null;
    },
  });
};

/**
 * useInterruptionAnalysis - Analyze session interruptions
 */
export const useInterruptionAnalysis = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['interruption-analysis', dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('analyze_interruptions', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data as InterruptionAnalysis;
    },
  });
};

/**
 * useOptimalSessionLength - Find optimal session duration per area
 */
export const useOptimalSessionLength = (dateRange: { start: Date; end: Date }, area?: string) => {
  return useQuery({
    queryKey: ['optimal-session-length', dateRange, area],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('analyze_optimal_session_length', {
        p_user_id: user.id,
        p_area: area || null,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as OptimalSessionLength[]) || [];
    },
  });
};

/**
 * useDeepWorkStreak - Calculate current consecutive day streak
 */
export const useDeepWorkStreak = () => {
  return useQuery({
    queryKey: ['deep-work-streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_deep_work_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as number;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * useProductivityRecommendations - Get personalized productivity insights
 */
export const useProductivityRecommendations = () => {
  return useQuery({
    queryKey: ['productivity-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('generate_productivity_recommendations', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data as ProductivityRecommendation[]) || [];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

/**
 * useContextSwitchingCost - Analyze impact of context switching
 */
export const useContextSwitchingCost = (dateRange: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: ['context-switching-cost', dateRange],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_context_switching_cost', {
        p_user_id: user.id,
        p_start_date: format(dateRange.start, 'yyyy-MM-dd'),
        p_end_date: format(dateRange.end, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return data as ContextSwitchingCost;
    },
  });
};

/**
 * useUpdateSessionMetadata - Update session metadata (goal_achieved, quality_rating, etc.)
 */
export const useUpdateSessionMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      goalAchieved,
      qualityRating,
      wasInterrupted,
      interruptionReason,
    }: {
      sessionId: string;
      goalAchieved?: boolean | null;
      qualityRating?: number | null;
      wasInterrupted?: boolean;
      interruptionReason?: string | null;
    }) => {
      const updates: Record<string, any> = {};
      if (goalAchieved !== undefined) updates.goal_achieved = goalAchieved;
      if (qualityRating !== undefined) updates.session_quality_rating = qualityRating;
      if (wasInterrupted !== undefined) updates.was_interrupted = wasInterrupted;
      if (interruptionReason !== undefined) updates.interruption_reason = interruptionReason;

      const { error } = await supabase
        .from('deep_work_log')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all insights queries
      queryClient.invalidateQueries({ queryKey: ['session-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['focus-quality'] });
      queryClient.invalidateQueries({ queryKey: ['completion-rate'] });
      queryClient.invalidateQueries({ queryKey: ['interruption-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['optimal-session-length'] });
      queryClient.invalidateQueries({ queryKey: ['deep-work-streak'] });
      queryClient.invalidateQueries({ queryKey: ['productivity-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['context-switching-cost'] });
    },
  });
};
