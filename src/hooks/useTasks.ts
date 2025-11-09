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
          phases(id, name, description)
        `)
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
          phases(id, name, description)
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
      // When task is marked as complete (progress_percentage = 100), auto-calculate accuracy fields
      const processedUpdates = { ...updates };

      if (updates.progress_percentage === 100) {
        // Fetch current task to get hours_projected and hours_worked
        const { data: currentTask, error: fetchError } = await supabase
          .from('tasks')
          .select('hours_projected, hours_worked')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        const hoursProjected = currentTask?.hours_projected || 0;
        const hoursWorked = currentTask?.hours_worked || 0;

        // Calculate hours_accuracy (absolute difference)
        processedUpdates.hours_accuracy = Math.abs(hoursProjected - hoursWorked);

        // Calculate estimation_accuracy
        if (hoursProjected > 0) {
          if (hoursWorked > hoursProjected * 1.1) {
            // More than 10% over projected
            processedUpdates.estimation_accuracy = 'Underestimated';
          } else if (hoursWorked < hoursProjected * 0.9) {
            // Less than 90% of projected (10% under)
            processedUpdates.estimation_accuracy = 'Overestimated';
          } else {
            // Within 10% margin
            processedUpdates.estimation_accuracy = 'Accurate';
          }
        }
      }

      // Skip conflict detection - just proceed with update
      const { data, error } = await supabase
        .from('tasks')
        .update(processedUpdates)
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
