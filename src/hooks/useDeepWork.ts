/**
 * React Query hooks for Deep Work Sessions
 * Queries deep_work_sessions table (or deep_work_log as fallback)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DeepWorkSession {
  id: string;
  user_id: string;
  business_id: string | null;
  life_area_id: string | null;
  project_id: string | null;
  phase_id: string | null;
  task_id: string | null;
  area: string | null;
  session_name: string | null;
  labels: string[];
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  is_planned: boolean;
  is_productive: boolean;
  was_interrupted: boolean;
  interruption_reason: string | null;
  goal_achieved: boolean | null;
  session_quality_rating: number | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  paused_duration: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDeepWorkSessionInput {
  session_name: string;
  area?: string;
  task_id?: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  is_planned?: boolean;
  is_productive?: boolean;
  status?: 'active' | 'paused' | 'completed' | 'cancelled';
  labels?: string[];
}

/**
 * Hook for fetching deep work sessions for a date range
 */
export function useDeepWorkSessions(startTime: string, endTime: string) {
  return useQuery({
    queryKey: ['deep-work-sessions', startTime, endTime],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Query deep_work_log and join with tasks to get task names
      let { data, error } = await supabase
        .from('deep_work_log')
        .select(`
          *,
          tasks:task_id (
            task_name
          )
        `)
        .eq('user_id', user.id)
        .gte('start_time', startTime)
        .lte('start_time', endTime)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Transform the data to include task_name at the top level
      const transformed = (data || []).map(session => ({
        ...session,
        task_name: session.tasks?.task_name || null,
      }));

      return transformed as any[];
    },
    staleTime: 30 * 1000, // 30 seconds
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
        })
        .select()
        .single();

      if (error) throw error;
      return data as DeepWorkSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deep-work-sessions'] });
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
    },
  });
}
