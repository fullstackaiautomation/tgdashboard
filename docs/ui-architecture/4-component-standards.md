# 4. Component Standards

### Component Template

```typescript
import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/types/task';

interface TaskCardProps {
  taskId: string;
  onComplete?: (taskId: string) => void;
  className?: string;
}

/**
 * TaskCard - Displays a single task with progress indicator and actions
 *
 * @param taskId - Unique identifier for the task
 * @param onComplete - Optional callback when task is marked complete
 * @param className - Optional Tailwind classes for styling
 */
export const TaskCard: FC<TaskCardProps> = ({ taskId, onComplete, className = '' }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch task data with React Query
  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data as Task;
    },
  });

  // Mutation for updating task
  const updateTask = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleToggleComplete = async () => {
    if (!task) return;

    await updateTask.mutateAsync({
      status: task.status === 'completed' ? 'active' : 'completed'
    });

    onComplete?.(taskId);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-800 h-24 rounded-lg" />;
  }

  if (error || !task) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Failed to load task</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors ${className}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={handleToggleComplete}
          className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
        />

        {/* Task Content */}
        <div className="flex-1">
          <h3 className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-gray-400 text-sm mt-1">{task.description}</p>
          )}

          {/* Progress indicator */}
          {task.progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    task.progress < 33 ? 'bg-red-500' :
                    task.progress < 67 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Naming Conventions

**Component Files:**
- **PascalCase** for component files: `TaskCard.tsx`, `BusinessDashboard.tsx`, `DeepWorkTimer.tsx`
- **Match component name:** File `TaskCard.tsx` exports `export const TaskCard`
- **Index files:** Use `index.ts` only for barrel exports, not for components

**Component Naming:**
- **Components:** PascalCase - `TaskCard`, `ProgressBar`, `BusinessDashboard`
- **Hooks:** camelCase with `use` prefix - `useTasks`, `useRealtimeSync`, `useAuth`
- **Utilities:** camelCase - `formatDate`, `calculateProgress`, `validateTask`
- **Types/Interfaces:** PascalCase - `Task`, `Project`, `Business`, `TaskCardProps`
- **Constants:** UPPER_SNAKE_CASE - `API_BASE_URL`, `MAX_TASKS_PER_PAGE`

**Variable Naming:**
- **React Query keys:** Array format - `['tasks']`, `['task', taskId]`, `['business', businessId, 'projects']`
- **Boolean variables:** Prefix with `is`, `has`, `should` - `isLoading`, `hasError`, `shouldSync`
- **Event handlers:** Prefix with `handle` - `handleSubmit`, `handleToggleComplete`, `handleDelete`
- **Callback props:** Prefix with `on` - `onComplete`, `onDelete`, `onChange`

**File Organization:**
- **Component file:** `TaskCard.tsx` (component + local types)
- **Hook file:** `useTasks.ts` (custom hook)
- **Type file:** `task.ts` (shared types, NOT `.tsx`)
- **Util file:** `progress.ts` (pure functions)

---
