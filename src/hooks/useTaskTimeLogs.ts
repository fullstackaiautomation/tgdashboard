import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TaskTimeLog {
  id: string;
  user_id: string;
  task_id: string;
  log_date: string;
  hours_worked: number;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all time logs for a specific task
 */
export const useTaskTimeLogs = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['task-time-logs', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_time_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('Error fetching task time logs:', error);
        throw error;
      }

      return (data || []) as TaskTimeLog[];
    },
    enabled: !!taskId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Create a new time log entry
 */
export const useCreateTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      taskId: string;
      logDate: string;
      hoursWorked: number;
      startTime?: string;
      endTime?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('task_time_logs')
        .insert({
          user_id: user.id,
          task_id: params.taskId,
          log_date: params.logDate,
          hours_worked: params.hoursWorked,
          start_time: params.startTime || null,
          end_time: params.endTime || null,
          notes: params.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-time-logs', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

/**
 * Update an existing time log entry
 */
export const useUpdateTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      taskId: string;
      updates: {
        log_date?: string;
        hours_worked?: number;
        start_time?: string | null;
        end_time?: string | null;
        notes?: string | null;
      };
    }) => {
      const { data, error } = await supabase
        .from('task_time_logs')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data as TaskTimeLog;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-time-logs', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

/**
 * Delete a time log entry
 */
export const useDeleteTimeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; taskId: string }) => {
      const { error } = await supabase
        .from('task_time_logs')
        .delete()
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-time-logs', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
