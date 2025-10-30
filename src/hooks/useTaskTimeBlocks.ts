import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook to check if a task has any time blocks scheduled
 */
export const useTaskHasTimeBlocks = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['task-has-time-blocks', taskId],
    queryFn: async () => {
      if (!taskId) return false;

      const { data, error } = await supabase
        .from('task_time_blocks')
        .select('id')
        .eq('task_id', taskId)
        .limit(1);

      if (error) {
        console.error('Error checking task time blocks:', error);
        return false;
      }

      return (data?.length ?? 0) > 0;
    },
    enabled: !!taskId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to get all time blocks for a task
 */
export const useTaskTimeBlocks = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['task-time-blocks', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_time_blocks')
        .select('*')
        .eq('task_id', taskId)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching task time blocks:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!taskId,
    staleTime: 30000, // 30 seconds
  });
};
