# TG Personal Dashboard System - Frontend Architecture Document

**Version:** 1.0
**Date:** 2025-10-06
**Author:** Winston (Architect Agent) 🏗️
**Project:** Personal Dashboard for Multi-Business Management

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-06 | v1.0 | Initial frontend architecture document | Winston (Architect) |

---

## 1. Template and Framework Selection

### Framework & Template Status

**✅ Current Stack Analysis:**

- **Frontend Framework:** React 19.1.1 (latest)
- **Build Tool:** Vite 7.1.7 (modern, fast bundler)
- **TypeScript:** v5.9.3 (type safety)
- **Styling:** Tailwind CSS 3.4.1 (utility-first CSS)
- **State Management:** React Query (TanStack Query 5.90.2) for server state
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **UI Icons:** Lucide React (modern icon library)
- **Date Handling:** date-fns 4.1.0

### Project Structure Analysis

Your project is already scaffolded with Vite + React + TypeScript, which is an excellent choice for this dashboard application. This stack provides:

**✅ Vite Benefits:**
- Lightning-fast HMR (Hot Module Replacement) for rapid development
- Optimized production builds with code splitting
- Native ESM support
- TypeScript out of the box

**✅ React 19 Benefits:**
- Latest React features and performance improvements
- Improved concurrent rendering
- Server components ready (if needed later)

**✅ Tailwind CSS Benefits:**
- Rapid UI development with utility classes
- Perfect for dark mode implementation (already configured)
- Small production bundle size (purges unused classes)
- Easy to maintain consistent design system

**✅ React Query Benefits:**
- Automatic caching and synchronization
- Background refetching
- Optimistic updates
- Perfect complement to Supabase real-time subscriptions

### Current File Structure

```
src/
├── main.tsx (entry point)
├── App.tsx (root component)
├── components/
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── TodoList.tsx
│   ├── ContentLibrary.tsx
│   └── finance/
│       └── FinanceDashboard.tsx
├── lib/
│   └── supabase.ts (Supabase client)
└── types/
    ├── task.tsx
    └── content.ts
```

### Decision

**✅ No additional starter template needed.** Your current Vite + React + TypeScript setup is optimal for this project. We'll build upon this foundation with architectural standards.

---

## 2. Frontend Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Framework** | React | 19.1.1 | Core UI framework for component-based architecture | Latest React version with improved concurrent rendering, stable performance, and excellent TypeScript support. Industry-standard choice for complex dashboards. |
| **UI Library** | Tailwind CSS | 3.4.1 | Utility-first CSS framework for rapid styling | Enables fast development with utility classes, built-in dark mode support, optimal for the project's dark theme aesthetic. Small production bundle via purging. |
| **State Management** | TanStack Query (React Query) | 5.90.2 | Server state synchronization and caching | Perfect complement to Supabase real-time subscriptions. Handles caching, background refetching, optimistic updates. Eliminates need for Redux/Zustand for server-synchronized state. |
| **Routing** | React Router | 6.x (recommended) | Client-side navigation | Enables deep linking, browser history, shareable URLs for business dashboards. Optional but recommended for multi-section navigation. |
| **Build Tool** | Vite | 7.1.7 | Development server and production bundler | Lightning-fast HMR, optimized builds, native ESM, superior to deprecated Create React App. Critical for "vibe coding" rapid iteration. |
| **Styling** | Tailwind CSS + CSS Variables | 3.4.1 | Utility-first styling with theme variables | Tailwind for components, CSS custom properties for global theme (colors, spacing). Supports dark mode and color-coded business areas. |
| **Testing** | Manual Testing | - | Quality assurance via manual verification | No automated test suite per PRD requirements. Relying on systematic manual testing and security checklists. |
| **Component Library** | Custom + Lucide Icons | 0.544.0 | UI components and iconography | Building custom components from scratch. Lucide provides modern icon set. **Consider:** Shadcn/UI for pre-built accessible components (modals, dropdowns, date pickers). |
| **Form Handling** | Controlled Components | - | Task editing, settings forms | Using controlled components (value + onChange). **Recommendation:** React Hook Form for complex forms with validation. |
| **Animation** | CSS Transitions | - | Progress bars, card animations | Using Tailwind's transition utilities. **Consider:** Framer Motion for complex progress animations and page transitions. |
| **Dev Tools** | TypeScript + ESLint | 5.9.3 / 9.36.0 | Type safety and code quality | TypeScript prevents runtime errors, ESLint enforces code standards. Critical for AI-assisted development to catch mistakes early. |
| **Date Handling** | date-fns | 4.1.0 | Date formatting and manipulation | Lightweight alternative to Moment.js, tree-shakeable, excellent for task due dates and scheduling. |
| **Backend Client** | Supabase JS | 2.58.0 | Database, auth, real-time subscriptions | Single SDK handles PostgreSQL queries, authentication, and real-time WebSocket connections. Eliminates need for custom API layer. |

---

## 3. Project Structure

### Recommended Directory Structure

```
tg-dashboard/
├── public/                          # Static assets
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component with auth routing
│   │
│   ├── components/                  # React components
│   │   ├── auth/                    # Authentication components
│   │   │   ├── Auth.tsx            # Login/signup form
│   │   │   └── ProtectedRoute.tsx  # Route guard component
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx          # Top navigation bar
│   │   │   ├── Sidebar.tsx         # Side navigation menu
│   │   │   └── Dashboard.tsx       # Main dashboard layout
│   │   │
│   │   ├── daily/                   # Daily section components
│   │   │   ├── TodoList.tsx        # Daily todo list (existing)
│   │   │   ├── Schedule.tsx        # Daily schedule view
│   │   │   ├── DeepWorkTimer.tsx   # Deep work timer panel
│   │   │   ├── Goals.tsx           # Daily goals tracking
│   │   │   └── Review.tsx          # Daily review view
│   │   │
│   │   ├── tasks/                   # Tasks hub components
│   │   │   ├── TasksHub.tsx        # Central tasks page
│   │   │   ├── TaskCard.tsx        # Individual task card
│   │   │   ├── TaskFilters.tsx     # Business/status filters
│   │   │   └── TaskForm.tsx        # Task create/edit form
│   │   │
│   │   ├── business/                # Business section components
│   │   │   ├── BusinessDashboard.tsx    # Business overview
│   │   │   ├── ProjectCard.tsx          # Project display card
│   │   │   ├── PhaseCard.tsx            # Phase display card
│   │   │   ├── ProgressBar.tsx          # Progress visualization
│   │   │   └── TimeInvestmentCard.tsx   # Time tracking card
│   │   │
│   │   ├── content/                 # Content section components
│   │   │   ├── ContentLibrary.tsx  # Content library (existing)
│   │   │   └── TeeUpWithTG.tsx     # Golf content section
│   │   │
│   │   ├── health/                  # Health section components
│   │   │   ├── HealthDashboard.tsx
│   │   │   ├── WorkoutTracker.tsx
│   │   │   └── MealPlanner.tsx
│   │   │
│   │   ├── finance/                 # Finance section components
│   │   │   ├── FinanceDashboard.tsx     # (existing)
│   │   │   ├── NetworthCard.tsx
│   │   │   ├── TransactionsList.tsx
│   │   │   └── BudgetTracker.tsx
│   │   │
│   │   ├── life/                    # Life section components
│   │   │   ├── LifeDashboard.tsx
│   │   │   ├── Journal.tsx
│   │   │   └── BrainDumps.tsx
│   │   │
│   │   ├── golf/                    # Golf section components
│   │   │   ├── GolfDashboard.tsx
│   │   │   ├── Scorecard.tsx
│   │   │   └── StrokesGained.tsx
│   │   │
│   │   ├── review/                  # Review dashboard components
│   │   │   ├── ReviewDashboard.tsx
│   │   │   ├── AreaSummaryCard.tsx
│   │   │   └── AlertsPanel.tsx
│   │   │
│   │   ├── shared/                  # Shared/reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Tabs.tsx
│   │   │
│   │   └── ui/                      # UI primitives (if using Shadcn/UI)
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── select.tsx
│   │       └── tooltip.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useTasks.ts             # Tasks CRUD operations
│   │   ├── useProjects.ts          # Projects CRUD operations
│   │   ├── useRealtimeSync.ts      # Supabase real-time subscription
│   │   ├── useDeepWork.ts          # Deep work timer logic
│   │   └── useProgress.ts          # Progress calculation hook
│   │
│   ├── lib/                         # Library configurations
│   │   ├── supabase.ts             # Supabase client (existing)
│   │   ├── queryClient.ts          # React Query client config
│   │   └── utils.ts                # Utility functions
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── task.ts                 # Task types (rename from .tsx)
│   │   ├── content.ts              # Content types (existing)
│   │   ├── project.ts              # Project/Phase types
│   │   ├── business.ts             # Business types
│   │   ├── health.ts               # Health types
│   │   ├── finance.ts              # Finance types
│   │   ├── user.ts                 # User/Auth types
│   │   └── database.ts             # Supabase database types (auto-generated)
│   │
│   ├── styles/                      # Global styles
│   │   ├── globals.css             # Global CSS + Tailwind imports
│   │   └── theme.css               # CSS custom properties (theme variables)
│   │
│   └── utils/                       # Utility functions
│       ├── date.ts                 # Date formatting utilities
│       ├── progress.ts             # Progress calculation logic
│       ├── sync.ts                 # Sync conflict resolution
│       └── validation.ts           # Form validation helpers
│
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables (gitignored)
├── .gitignore                       # Git ignore rules
├── index.html                       # HTML entry point
├── package.json                     # Dependencies
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration
```

### Architectural Decisions

**Feature-Based Organization:** Components organized by dashboard section (daily/, business/, health/, etc.) aligns with the 7 main areas from PRD.

**Shared Components:** Reusable UI components in `components/shared/` for elements used across multiple sections.

**Hooks Directory:** Custom hooks centralized in `hooks/` for reusability and easier testing of business logic.

**Types Organization:** All TypeScript types in `types/` as `.ts` files (not `.tsx`). Use `database.ts` auto-generated from Supabase schema.

---

## 4. Component Standards

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

## 5. State Management

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

## 6. API Integration

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

## 7. Routing

### Route Configuration (Recommended: React Router)

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Auth } from '@/components/auth/Auth';

// Page imports
import { TodoList } from '@/components/daily/TodoList';
import { TasksHub } from '@/components/tasks/TasksHub';
import { BusinessDashboard } from '@/components/business/BusinessDashboard';
import { ReviewDashboard } from '@/components/review/ReviewDashboard';
// ... other imports

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Auth />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/review" replace />} />
                <Route path="/review" element={<ReviewDashboard />} />

                {/* Daily Section */}
                <Route path="/daily/todo" element={<TodoList />} />
                <Route path="/daily/schedule" element={<Schedule />} />

                {/* Tasks Hub */}
                <Route path="/tasks" element={<TasksHub />} />

                {/* Business Section */}
                <Route path="/business" element={<BusinessDashboard />} />
                <Route path="/business/:businessId" element={<BusinessDetail />} />

                {/* Other sections */}
                <Route path="/health" element={<HealthDashboard />} />
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/life" element={<LifeDashboard />} />
                <Route path="/golf" element={<GolfDashboard />} />

                <Route path="*" element={<Navigate to="/review" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Protected Route Component

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

### Routing Recommendations

**Add React Router** for:
- ✅ Deep linking and shareable URLs (e.g., `/business/huge-capital`)
- ✅ Browser history navigation (back/forward buttons)
- ✅ Multi-tab support (different sections in different tabs)
- ✅ Client collaboration (share specific business dashboards)
- ✅ Professional appearance (URLs in screenshots for case studies)

**Installation:** `npm install react-router-dom`

---

## 8. Styling Guidelines

### Styling Approach

**Primary Method:** Tailwind CSS utility classes with CSS custom properties for theme variables.

**Component Styling Pattern:**

```typescript
// Basic component with Tailwind
export const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <h3 className="text-lg font-medium text-gray-100">{task.title}</h3>
      <p className="text-sm text-gray-400 mt-1">{task.description}</p>
    </div>
  );
};

// Dynamic business colors using CSS variables
export const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <div
      className="rounded-lg p-6 border-2"
      style={{
        backgroundColor: `var(--color-business-${business.slug}-bg)`,
        borderColor: `var(--color-business-${business.slug})`
      }}
    >
      <h2 className="text-xl font-bold">{business.name}</h2>
    </div>
  );
};
```

### Global Theme Variables

```css
/* src/styles/theme.css */

:root {
  /* Base Colors - Dark Mode */
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #1f2937;  /* gray-800 */
  --color-bg-tertiary: #374151;   /* gray-700 */

  --color-text-primary: #f3f4f6;  /* gray-100 */
  --color-text-secondary: #9ca3af; /* gray-400 */

  /* Brand Colors */
  --color-primary: #ff8c42;        /* Orange - Primary CTA */
  --color-primary-hover: #ff7a2e;

  /* Status Colors */
  --color-success: #10b981;        /* green-500 */
  --color-warning: #f59e0b;        /* yellow-500 */
  --color-error: #ef4444;          /* red-500 */

  /* Progress Gradient */
  --color-progress-low: #ef4444;   /* red: 0-33% */
  --color-progress-mid: #f59e0b;   /* yellow: 34-66% */
  --color-progress-high: #10b981;  /* green: 67-100% */

  /* Business Color Coding */
  --color-business-fullstack: #10b981;
  --color-business-fullstack-bg: rgba(16, 185, 129, 0.1);

  --color-business-hugecapital: #a855f7;
  --color-business-hugecapital-bg: rgba(168, 85, 247, 0.1);

  --color-business-s4: #3b82f6;
  --color-business-s4-bg: rgba(59, 130, 246, 0.1);

  --color-business-808: #f97316;
  --color-business-808-bg: rgba(249, 115, 22, 0.1);

  /* Life Area Colors */
  --color-area-health: #14b8a6;    /* Teal */
  --color-area-health-bg: rgba(20, 184, 166, 0.1);

  --color-area-personal: #ec4899;  /* Pink */
  --color-area-golf: #f97316;      /* Orange-red */
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

/* Focus Visible */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff8c42',
      },
    },
  },
};
```

### Common Patterns

**Cards:**
```tsx
<div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
```

**Buttons:**
```tsx
<button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
```

**Progress Bars:**
```tsx
<div className="w-full bg-gray-700 rounded-full h-2">
  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
</div>
```

---

## 9. Testing Requirements

### Testing Strategy: Manual Testing with Convenience Methods

Per PRD requirements, this project uses **manual testing** instead of automated test suites.

### Development Test Helpers

```typescript
// src/utils/testHelpers.ts

export async function seedTestData() {
  const { data: { user } } = await supabase.auth.getUser();
  // Seed businesses, projects, tasks...
  console.log('✅ Test data seeded successfully');
}

export async function clearTestData() {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('tasks').delete().eq('user_id', user.id);
  console.log('✅ Test data cleared');
}

export async function debugState() {
  const { data: tasks } = await supabase.from('tasks').select('*');
  console.log('🔍 Current Database State', tasks);
}

export async function testSyncLatency(taskId: string) {
  const startTime = performance.now();
  await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
  // Measure real-time sync latency...
  console.log(`⏱️ Sync latency: ${latency}ms`);
}
```

### Browser Console Access (Development Only)

```typescript
// src/main.tsx
if (import.meta.env.DEV) {
  import('./utils/testHelpers').then((helpers) => {
    (window as any).__test = {
      seedData: helpers.seedTestData,
      clearData: helpers.clearTestData,
      debug: helpers.debugState,
      testSync: helpers.testSyncLatency,
    };
  });
}

// Usage in browser console:
// __test.seedData()
// __test.debug()
// __test.testSync('task-id')
```

### Manual Testing Workflow

1. **Feature Testing:** Execute feature → Verify across affected pages → Check console for errors
2. **Cross-Page Sync:** Test in 2+ tabs → Verify real-time updates → Measure sync latency (<500ms)
3. **Data Integrity:** CRUD operations → Verify with `__test.debug()` → Check for orphaned records
4. **Performance:** Seed 100+ tasks → Measure page load (<2s) → Monitor React Query cache
5. **Security Checklist:** GitHub secret scan → DevTools network inspection → RLS policy verification
6. **Edge Cases:** Empty states, loading states, error states, concurrent edits, overdue tasks

---

## 10. Environment Configuration

### Environment Variables

```bash
# .env.example (Safe to commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=TG Dashboard
VITE_APP_URL=https://tgdashboard.fullstackaiautomation.com
VITE_ENV=development
```

```bash
# .env.local (NEVER commit - gitignored)
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
VITE_ENV=development
VITE_ENABLE_DEBUG_TOOLS=true
```

### Type-Safe Configuration

```typescript
// src/config/env.ts
interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    url: string;
    env: 'development' | 'staging' | 'production';
  };
}

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env: EnvConfig = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  app: {
    name: getEnvVar('VITE_APP_NAME'),
    url: getEnvVar('VITE_APP_URL'),
    env: getEnvVar('VITE_ENV') as 'development' | 'production',
  },
};

export const isDevelopment = env.app.env === 'development';
export const isProduction = env.app.env === 'production';
```

### GitHub Actions Deployment

```yaml
# .github/workflows/deploy.yml
- name: Build with environment variables
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    VITE_ENV: "production"
  run: npm run build
```

### Security Best Practices

**✅ Safe to Expose (Client Bundle):**
- Supabase URL
- Supabase anon key (protected by RLS)
- API URLs
- Feature flags

**❌ NEVER Expose:**
- Supabase service_role key (bypasses RLS)
- Private API keys
- Database credentials
- Passwords

**Pre-Deployment Checklist:**
- ✅ No `service_role` in src/: `grep -r "service_role" src/`
- ✅ `.env.local` in `.gitignore`
- ✅ GitHub Secrets configured
- ✅ Production build inspection: `cat dist/assets/*.js | grep -i "service"`

---

## 11. Frontend Developer Standards

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

## Architecture Summary

This frontend architecture is designed for:

✅ **Rapid Development:** Vite + React + Tailwind for fast iteration
✅ **Type Safety:** TypeScript + Supabase generated types
✅ **Real-Time Sync:** Supabase real-time + React Query optimistic updates
✅ **Security First:** RLS policies, environment variable validation, pre-deployment checklists
✅ **Performance:** <2s page loads, <500ms sync latency, 100+ task support
✅ **Maintainability:** Feature-based structure, consistent patterns, AI-friendly conventions

**Next Steps:**
1. Install React Router (if using): `npm install react-router-dom`
2. Generate Supabase types: `npx supabase gen types typescript`
3. Review security checklist before deployments
4. Use test helpers for rapid manual testing
5. Follow critical coding rules for AI-assisted development

---

**Document Status:** ✅ Complete and Ready for Implementation
**Architecture Phase:** Frontend specifications complete, ready for development
