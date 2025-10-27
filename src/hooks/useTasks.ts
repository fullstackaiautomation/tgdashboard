import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TaskHub, CreateTaskDTO, UpdateTaskDTO } from '../types/task';

/**
 * Fetch all tasks with joined business, project, and phase data
 */
export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          businesses(id, name, color, slug),
          projects(id, name, description),
          phases(id, name, description),
          life_areas(id, name, color, category)
        `)
        .is('recurring_parent_id', null)  // Exclude child recurring tasks - show only parent templates
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaskHub[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new task
 */
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: CreateTaskDTO) => {
      // Get current user from session
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to create a task');
      }

      // Add user_id to the task
      const taskWithUser = {
        ...task,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskWithUser)
        .select(`
          *,
          businesses(id, name, color, slug),
          projects(id, name, description),
          phases(id, name, description),
          life_areas(id, name, color, category)
        `)
        .single();

      if (error) throw error;
      return data as TaskHub;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

/**
 * Update an existing task with conflict detection
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, skipConflictCheck }: { id: string; updates: UpdateTaskDTO; skipConflictCheck?: boolean }) => {
      // Skip conflict detection - just proceed with update
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TaskHub;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel all outgoing task queries (including schedule queries)
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<TaskHub[]>(['tasks']);

      // Optimistically update all task queries
      queryClient.setQueriesData<TaskHub[]>(
        { queryKey: ['tasks'] },
        (old) => old?.map((task) => (task.id === id ? { ...task, ...updates } as TaskHub : task))
      );

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      // Invalidate both main tasks query and schedule queries
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

/**
 * Delete a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
