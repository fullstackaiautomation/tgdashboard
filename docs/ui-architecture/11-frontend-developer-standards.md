# 11. Frontend Developer Standards

### Critical Coding Rules

**Security Rules:**

1. **NEVER expose secrets in client code**
   - ❌ No service_role keys, private API keys, or passwords in src/
   - ✅ Only use `VITE_SUPABASE_ANON_KEY` (protected by RLS)
   - **Check:** `grep -r "service_role" src/` before commits

2. **NEVER skip Supabase Row Level Security (RLS)**
   - ❌ No tables without RLS policies
   - ✅ Every table has RLS with `user_id = auth.uid()` check

3. **NEVER trust user input**
   - ✅ Use parameterized queries: `.eq('id', userId)`
   - ✅ Validate all form inputs before submission

**TypeScript Rules:**

4. **ALWAYS use TypeScript types**
   - ❌ No `any` without explicit comment
   - ✅ Define interfaces for props, API responses, database records
   - ✅ Use Supabase generated types: `supabase gen types typescript`

**React Rules:**

5. **ALWAYS handle loading and error states**
   - ❌ No components that assume data is loaded
   - ✅ Early return pattern: `if (isLoading) return <Skeleton />`
   - ✅ Show error UI: `if (error) return <ErrorMessage />`

6. **NEVER use array index as key**
   - ❌ `tasks.map((task, i) => <TaskCard key={i} />)`
   - ✅ `tasks.map((task) => <TaskCard key={task.id} />)`

7. **ALWAYS clean up subscriptions**
   - ✅ Return cleanup from useEffect
   - ✅ Use `supabase.removeChannel(channel)` in cleanup

**React Query Rules:**

8. **NEVER mutate cache directly**
   - ❌ Don't mutate `queryClient.getQueryData()` results
   - ✅ Use `queryClient.setQueryData()` or `invalidateQueries()`

9. **ALWAYS use consistent query keys**
   - ✅ Hierarchical: `['tasks']` → `['tasks', businessId]` → `['task', taskId]`
   - ✅ Invalidate broadly: `invalidateQueries(['tasks'])`

**Supabase Rules:**

10. **ALWAYS include relations in select**
    - ❌ `select('*')` when you need related data
    - ✅ `select('*, businesses(name, color), projects(name)')`

11. **NEVER use `.single()` without error handling**
    - ✅ Always check: `if (error) throw error;`

**Business Logic Rules:**

12. **NEVER hardcode business IDs or colors**
    - ✅ Use CSS variables: `var(--color-business-${slug})`
    - ✅ Derive from database fields

### Quick Reference

**Commands:**
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Lint code
npx supabase gen types   # Generate types
```

**Common Imports:**
```typescript
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
```

**Supabase Patterns:**
```typescript
// Fetch with relations
const { data } = await supabase
  .from('tasks')
  .select('*, businesses(name, color)')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Real-time subscription
useEffect(() => {
  const channel = supabase
    .channel('task-changes')
    .on('postgres_changes', { event: '*', table: 'tasks' }, () => {
      queryClient.invalidateQueries(['tasks']);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

**React Query Patterns:**
```typescript
// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => TaskService.getAll(),
});

// Optimistic update
const updateTask = useMutation({
  mutationFn: ({ id, updates }) => TaskService.update(id, updates),
  onMutate: async ({ id, updates }) => {
    await queryClient.cancelQueries(['tasks']);
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], (old) =>
      old.map(t => t.id === id ? { ...t, ...updates } : t)
    );
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['tasks']);
  },
});
```

**Component Patterns:**
```typescript
// Loading state
if (isLoading) return <div className="animate-pulse bg-gray-800 h-24 rounded-lg" />;

// Error state
if (error) return <div className="bg-red-900/20 border border-red-500 p-4">Error</div>;

// Empty state
if (!data?.length) return <div className="text-gray-400 py-12">No data</div>;

// Business color coding
<div style={{
  backgroundColor: `var(--color-business-${business.slug}-bg)`,
  borderColor: `var(--color-business-${business.slug})`
}} />

// Progress colors
const getProgressColor = (progress: number) => {
  if (progress < 33) return 'bg-red-500';
  if (progress < 67) return 'bg-yellow-500';
  return 'bg-green-500';
};
```

---
