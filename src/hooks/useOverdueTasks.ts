// Story 5.6: Hook for fetching overdue tasks across all areas
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface OverdueTask {
  task_id: string;
  task_name: string;
  area: string;
  due_date: string;
  days_overdue: number;
  priority: 'Low' | 'Medium' | 'High';
  phase_name: string | null;
  project_name: string | null;
  business_name: string | null;
}

export const useOverdueTasks = () => {
  return useQuery({
    queryKey: ['overdue-tasks'],
    queryFn: async (): Promise<OverdueTask[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_overdue_tasks', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching overdue tasks:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchInterval: 120000, // Refetch every 2 minutes
  });
};
