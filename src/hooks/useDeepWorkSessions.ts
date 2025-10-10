import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Deep Work Log interface matching the existing table
export interface DeepWorkLog {
  id: string;
  user_id: string;
  task_id: string | null;
  area: string;
  task_type: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at?: string;
  task?: {
    task_name: string;
  };
}

export interface CreateDeepWorkLogInput {
  task_id?: string | null;
  area: string;
  task_type?: string | null;
  start_time: string;
}

export interface UpdateDeepWorkLogInput {
  end_time?: string;
  duration_minutes?: number;
}

/**
 * Hook for fetching deep work sessions from deep_work_log
 */
export function useDeepWorkSessions(filters?: { taskId?: string; area?: string }) {
  return useQuery({
    queryKey: ['deep-work-sessions', filters],
    queryFn: async () => {
      // First, get all deep work sessions
      let query = supabase
        .from('deep_work_log')
        .select('*')
        .order('start_time', { ascending: false });

      if (filters?.taskId) {
        query = query.eq('task_id', filters.taskId);
      }
      if (filters?.area) {
        query = query.eq('area', filters.area);
      }

      const { data: sessions, error } = await query;
      if (error) throw error;

      // Then, get task names for sessions that have task_id
      const sessionWithTasks = await Promise.all(
        (sessions || []).map(async (session) => {
          if (session.task_id) {
            const { data: task } = await supabase
              .from('tasks')
              .select('task_name')
              .eq('id', session.task_id)
              .single();

            return {
              ...session,
              task: task ? { task_name: task.task_name } : null,
            };
          }
          return { ...session, task: null };
        })
      );

      return sessionWithTasks as DeepWorkLog[];
    },
  });
}

/**
 * Hook for creating a deep work session
 */
export function useCreateDeepWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDeepWorkLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .insert({
          ...input,
          user_id: user.id,
          duration_minutes: null, // Will be calculated when session ends
          end_time: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DeepWorkLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deep-work-sessions'] });
    },
  });
}

/**
 * Hook for updating a deep work session
 */
export function useUpdateDeepWorkSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateDeepWorkLogInput }) => {
      const { data, error } = await supabase
        .from('deep_work_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DeepWorkLog;
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

/**
 * Hook for completing a deep work session
 * This is a convenience function that updates the session with end_time and duration
 */
export function useCompleteDeepWorkSession() {
  const updateSession = useUpdateDeepWorkSession();

  return useMutation({
    mutationFn: async ({
      id,
      durationMinutes,
    }: {
      id: string;
      durationMinutes: number;
    }) => {
      return updateSession.mutateAsync({
        id,
        updates: {
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
        },
      });
    },
  });
}
