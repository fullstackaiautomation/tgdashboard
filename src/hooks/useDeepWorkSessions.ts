/**
 * React Query hooks for Deep Work Sessions
 * Story 4.1: Time Allocation Calculation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  DeepWorkSession,
  CreateDeepWorkSessionInput,
  UpdateDeepWorkSessionInput,
  DeepWorkFilters,
} from '@/types/deepWork';

/**
 * Hook for fetching deep work sessions with optional filters
 */
export function useDeepWorkSessions(filters: DeepWorkFilters = {}) {
  return useQuery({
    queryKey: ['deep-work-sessions', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('deep_work_log')
        .select(`
          *,
          tasks:task_id(id, task_name)
        `)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      // Apply filters
      if (filters.dateRange) {
        query = query
          .gte('start_time', filters.dateRange.start.toISOString())
          .lte('start_time', filters.dateRange.end.toISOString());
      }

      if (filters.area) {
        query = query.eq('area', filters.area);
      }

      if (filters.taskType) {
        query = query.eq('task_type', filters.taskType);
      }

      if (filters.taskId) {
        query = query.eq('task_id', filters.taskId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.labels && filters.labels.length > 0) {
        query = query.overlaps('labels', filters.labels);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DeepWorkSession[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new deep work session
 */
export function useCreateDeepWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeepWorkSessionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .insert({
          user_id: user.id,
          ...input,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as DeepWorkSession;
    },
    onSuccess: () => {
      // Invalidate all deep work and time allocation queries
      queryClient.invalidateQueries({ queryKey: ['deep-work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['time-allocation'] });
    },
  });
}

/**
 * Hook for updating a deep work session
 */
export function useUpdateDeepWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateDeepWorkSessionInput }) => {
      const { data, error } = await supabase
        .from('deep_work_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DeepWorkSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deep-work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['time-allocation'] });
    },
  });
}

/**
 * Hook for deleting a deep work session
 */
export function useDeleteDeepWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deep_work_log')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deep-work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['time-allocation'] });
    },
  });
}

/**
 * Hook for completing a deep work session
 * Updates status to 'completed' and sets end_time
 */
export function useCompleteDeepWorkSession() {
  const updateSession = useUpdateDeepWorkSession();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateSession.mutateAsync({
        id,
        updates: {
          end_time: new Date().toISOString(),
          status: 'completed',
        },
      });
    },
  });
}

/**
 * Hook for pausing a deep work session
 */
export function usePauseDeepWorkSession() {
  const updateSession = useUpdateDeepWorkSession();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateSession.mutateAsync({
        id,
        updates: {
          status: 'paused',
        },
      });
    },
  });
}

/**
 * Hook for resuming a paused deep work session
 */
export function useResumeDeepWorkSession() {
  const updateSession = useUpdateDeepWorkSession();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateSession.mutateAsync({
        id,
        updates: {
          status: 'active',
        },
      });
    },
  });
}

/**
 * Hook for cancelling a deep work session
 */
export function useCancelDeepWorkSession() {
  const updateSession = useUpdateDeepWorkSession();

  return useMutation({
    mutationFn: async (id: string) => {
      return updateSession.mutateAsync({
        id,
        updates: {
          status: 'cancelled',
          end_time: new Date().toISOString(),
        },
      });
    },
  });
}

/**
 * Hook for fetching active (running) deep work session
 * Useful for displaying the current timer
 */
export function useActiveDeepWorkSession() {
  return useQuery({
    queryKey: ['deep-work-sessions', 'active'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .select(`
          *,
          tasks:task_id(id, task_name)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DeepWorkSession | null;
    },
    refetchInterval: 1000, // Refetch every second for live timer
  });
}
