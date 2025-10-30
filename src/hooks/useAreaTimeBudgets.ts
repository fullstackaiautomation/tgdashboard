import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AreaTimeBudget {
  id: string;
  user_id: string;
  area: string;
  target_hours_per_week: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch all area time budgets for the current user
 *
 * @returns React Query result with area time budgets
 */
export const useAreaTimeBudgets = () => {
  return useQuery({
    queryKey: ['area-time-budgets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('area_time_budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as AreaTimeBudget[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a specific area's time budget
 *
 * @param area - The life area to fetch budget for
 * @returns React Query result with the area's time budget
 */
export const useAreaTimeBudget = (area: string) => {
  return useQuery({
    queryKey: ['area-time-budget', area],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('area_time_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('area', area)
        .maybeSingle();

      if (error) throw error;
      return data as AreaTimeBudget | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create or update an area time budget
 *
 * @returns Mutation function to upsert area time budget
 */
export const useUpsertAreaTimeBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ area, targetHours }: { area: string; targetHours: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('area_time_budgets')
        .upsert({
          user_id: user.id,
          area,
          target_hours_per_week: targetHours,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,area',
        })
        .select()
        .single();

      if (error) throw error;
      return data as AreaTimeBudget;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['area-time-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['area-time-budget', variables.area] });
    },
  });
};

/**
 * Hook to delete an area time budget
 *
 * @returns Mutation function to delete area time budget
 */
export const useDeleteAreaTimeBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (area: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('area_time_budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('area', area);

      if (error) throw error;
    },
    onSuccess: (_, area) => {
      queryClient.invalidateQueries({ queryKey: ['area-time-budgets'] });
      queryClient.invalidateQueries({ queryKey: ['area-time-budget', area] });
    },
  });
};

/**
 * Hook to batch upsert multiple area time budgets
 *
 * @returns Mutation function to upsert multiple area time budgets
 */
export const useBatchUpsertAreaTimeBudgets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budgets: Array<{ area: string; targetHours: number }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const budgetsToUpsert = budgets.map(b => ({
        user_id: user.id,
        area: b.area,
        target_hours_per_week: b.targetHours,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('area_time_budgets')
        .upsert(budgetsToUpsert, {
          onConflict: 'user_id,area',
        })
        .select();

      if (error) throw error;
      return data as AreaTimeBudget[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-time-budgets'] });
    },
  });
};
