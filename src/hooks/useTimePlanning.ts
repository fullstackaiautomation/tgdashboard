/**
 * useTimePlanning - React Query hooks for Time Allocation Targets & Planning (Story 4.5)
 *
 * Hooks for managing time targets, planned vs. actual comparison, forecasting, and recommendations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfWeek, format } from 'date-fns';
import type {
  AreaTimeTarget,
  UserSettings,
  PlannedVsActual,
  WeeklyForecast,
  TargetRecommendation,
  Area,
} from '@/types/planning';

/**
 * useAreaTargets - Fetch all area time targets for the current user
 */
export const useAreaTargets = () => {
  return useQuery({
    queryKey: ['area-targets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('area_time_targets')
        .select('*')
        .eq('user_id', user.id)
        .order('area');

      if (error) throw error;
      return (data as AreaTimeTarget[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useUserSettings - Fetch user settings (available work hours)
 */
export const useUserSettings = () => {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as UserSettings | null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * usePlannedVsActual - Fetch planned vs. actual comparison for the week
 */
export const usePlannedVsActual = (weekStart: Date) => {
  return useQuery({
    queryKey: ['planned-vs-actual', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_planned_vs_actual', {
        p_user_id: user.id,
        p_week_start: format(weekStart, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as PlannedVsActual[]) || [];
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * useWeeklyForecast - Forecast if weekly targets will be met
 */
export const useWeeklyForecast = (weekStart: Date) => {
  return useQuery({
    queryKey: ['weekly-forecast', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('forecast_weekly_targets', {
        p_user_id: user.id,
        p_week_start: format(weekStart, 'yyyy-MM-dd'),
      });

      if (error) throw error;
      return (data as WeeklyForecast[]) || [];
    },
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * useTargetRecommendations - Get recommendations for adjusting targets
 */
export const useTargetRecommendations = () => {
  return useQuery({
    queryKey: ['target-recommendations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('detect_target_mismatches', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data as TargetRecommendation[]) || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * useUpsertAreaTarget - Create or update an area time target
 */
export const useUpsertAreaTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      area,
      targetHours,
    }: {
      area: Area;
      targetHours: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('area_time_targets')
        .upsert({
          user_id: user.id,
          area,
          target_hours_per_week: targetHours,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,area',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-targets'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-forecast'] });
      queryClient.invalidateQueries({ queryKey: ['target-recommendations'] });
    },
  });
};

/**
 * useDeleteAreaTarget - Delete an area time target
 */
export const useDeleteAreaTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (area: Area) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('area_time_targets')
        .delete()
        .eq('user_id', user.id)
        .eq('area', area);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-targets'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-forecast'] });
    },
  });
};

/**
 * useSetTemporaryOverride - Set a temporary target override
 */
export const useSetTemporaryOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      area,
      overrideHours,
      startDate,
      endDate,
    }: {
      area: Area;
      overrideHours: number;
      startDate: Date;
      endDate: Date;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('area_time_targets')
        .update({
          temporary_target_override: overrideHours,
          override_start_date: format(startDate, 'yyyy-MM-dd'),
          override_end_date: format(endDate, 'yyyy-MM-dd'),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('area', area);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-targets'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-forecast'] });
    },
  });
};

/**
 * useClearTemporaryOverride - Clear a temporary target override
 */
export const useClearTemporaryOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (area: Area) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('area_time_targets')
        .update({
          temporary_target_override: null,
          override_start_date: null,
          override_end_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('area', area);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-targets'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-forecast'] });
    },
  });
};

/**
 * useUpsertUserSettings - Create or update user settings
 */
export const useUpsertUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (availableHours: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          available_work_hours_per_week: availableHours,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
};

/**
 * useBulkResetTargets - Reset all targets to null
 */
export const useBulkResetTargets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('area_time_targets')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-targets'] });
      queryClient.invalidateQueries({ queryKey: ['planned-vs-actual'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-forecast'] });
      queryClient.invalidateQueries({ queryKey: ['target-recommendations'] });
    },
  });
};
