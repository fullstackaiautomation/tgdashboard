# 6. API Integration

### Service Template

```typescript
// src/services/taskService.ts
import { supabase } from '@/lib/supabase';
import type { Task, CreateTaskDTO, UpdateTaskDTO } from '@/types/task';

export class TaskService {
  static async getAll(filters?: {
    businessId?: string;
    status?: string;
    dueDate?: string;
  }): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects (id, name),
          phases (id, name),
          businesses (id, name, color)
        `);

      if (filters?.businessId) {
        query = query.eq('business_id', filters.businessId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    } catch (error) {
      console.error('TaskService.getAll error:', error);
      throw new Error('Failed to fetch tasks');
    }
  }

  static async create(task: CreateTaskDTO): Promise<Task> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    } catch (error) {
      console.error('TaskService.create error:', error);
      throw new Error('Failed to create task');
    }
  }

  static async update(id: string, updates: UpdateTaskDTO): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    } catch (error) {
      console.error('TaskService.update error:', error);
      throw new Error(`Failed to update task with id: ${id}`);
    }
  }
}
```

### API Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'tg-dashboard',
    },
  },
});
```

### API Architecture

- **Service Layer Pattern:** Static class methods (TaskService, ProjectService) for centralized API logic
- **Direct Supabase Client:** Frontend calls Supabase directly, no custom backend API layer
- **Type Safety:** Use auto-generated database types from `supabase gen types typescript`
- **Error Handling:** Custom APIError class with Supabase error details for consistent error structure
- **Authentication:** Supabase manages session in localStorage with automatic token refresh and RLS enforcement

---
