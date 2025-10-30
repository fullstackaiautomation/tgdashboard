# 7. Routing

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
