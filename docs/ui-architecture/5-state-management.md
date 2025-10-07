# 5. State Management

### Store Structure

```
src/
├── hooks/                           # Custom hooks for state logic
│   ├── useAuth.ts                  # Authentication state
│   ├── useTasks.ts                 # Tasks CRUD + sync
│   ├── useProjects.ts              # Projects CRUD
│   ├── useRealtimeSync.ts          # Supabase real-time subscriptions
│   ├── useDeepWork.ts              # Deep work timer state
│   └── useProgress.ts              # Progress calculations
│
├── contexts/                        # React Context for global state (optional)
│   ├── AuthContext.tsx             # User authentication state
│   └── ThemeContext.tsx            # Dark mode theme (if light mode added later)
│
└── lib/
    └── queryClient.ts              # React Query client configuration
```

### State Management Patterns

**React Query Hook Pattern (Primary State Management):**

```typescript
// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/types/task';

export function useTasks(businessId?: string) {
  const queryClient = useQueryClient();

  // Fetch all tasks (with optional business filter)
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: businessId ? ['tasks', 'business', businessId] : ['tasks'],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*, projects(name), businesses(name, color)');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
  });

  // Update task mutation with optimistic updates
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: Task[] = []) =>
        old.map(task => task.id === id ? { ...task, ...updates } : task)
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

  return {
    tasks,
    isLoading,
    error,
    updateTask,
  };
}
```

**Supabase Real-Time Subscription Hook:**

```typescript
// src/hooks/useRealtimeSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealtimeSync(
  table: string,
  queryKey: string[],
  filter?: { column: string; value: string }
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        (payload) => {
          console.log(`Real-time update on ${table}:`, payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryKey, filter, queryClient]);
}
```

**Auth Context (Global State):**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, FC, PropsWithChildren } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**React Query Client Configuration:**

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### State Management Architecture

- **React Query:** Primary state manager for server state (tasks, projects, businesses)
- **Optimistic Updates:** Immediate UI feedback with rollback on error (critical for <500ms sync requirement)
- **Real-Time Sync:** Supabase channels invalidate React Query cache for multi-tab synchronization
- **Auth Context:** Minimal global state for user session (infrequently changing data)
- **Query Key Strategy:** Hierarchical keys (`['tasks']` → `['tasks', 'business', businessId]`) for granular cache invalidation

---
