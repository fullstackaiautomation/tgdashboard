// Story 5.3: Business Area Summary Hook (Simplified)
// Aggregate metrics across all business areas

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface BusinessAreaSummary {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overallCompletionPercentage: number;
  hoursThisWeek: number;
  overdueTasks: number;
}

interface RawBusinessSummary {
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  overall_completion_percentage: number;
  hours_this_week: number;
  overdue_tasks: number;
}

export const useBusinessAreaSummary = () => {
  return useQuery<BusinessAreaSummary, Error>({
    queryKey: ['business', 'area-summary'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Authentication failed');
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_business_area_summary', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Business area summary query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          activeTasks: 0,
          overallCompletionPercentage: 0,
          hoursThisWeek: 0,
          overdueTasks: 0,
        };
      }

      const raw = data[0] as RawBusinessSummary;

      return {
        totalTasks: raw.total_tasks,
        completedTasks: raw.completed_tasks,
        activeTasks: raw.active_tasks,
        overallCompletionPercentage: raw.overall_completion_percentage || 0,
        hoursThisWeek: raw.hours_this_week || 0,
        overdueTasks: raw.overdue_tasks,
      };
    },
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
  });
};
