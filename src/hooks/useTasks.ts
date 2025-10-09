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
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
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
      // Get current server state for conflict detection
      if (!skipConflictCheck) {
        const { data: currentTask, error: fetchError } = await supabase
          .from('tasks')
          .select('updated_at')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Get local cached task
        const cachedTasks = queryClient.getQueryData<TaskHub[]>(['tasks']);
        const localTask = cachedTasks?.find(t => t.id === id);

        // Conflict detection: compare timestamps
        if (localTask && currentTask) {
          const localTimestamp = new Date(localTask.updated_at).getTime();
          const serverTimestamp = new Date(currentTask.updated_at).getTime();

          // If server is newer than local, there's a conflict
          if (serverTimestamp > localTimestamp) {
            const shouldOverwrite = window.confirm(
              'This task was updated by another session. Do you want to overwrite those changes with yours?'
            );

            if (!shouldOverwrite) {
              // User chose to discard their changes
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              throw new Error('Update cancelled - task was modified elsewhere');
            }
          }
        }
      }

      // Proceed with update
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
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<TaskHub[]>(['tasks']);

      // Optimistically update
      queryClient.setQueryData<TaskHub[]>(['tasks'], (old) =>
        old?.map((task) => (task.id === id ? { ...task, ...updates } as TaskHub : task))
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
