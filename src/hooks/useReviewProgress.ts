/**
 * React Query hook for Review Dashboard Progress Aggregation
 * Story 2.6: Review Dashboard Progress Aggregation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export type AreaType = 'DAILY' | 'BIZNESS' | 'CONTENT' | 'HEALTH' | 'FINANCES' | 'LIFE' | 'GOLF';

export interface AreaProgress {
  area: AreaType;
  progress: number; // 0-100
  activeCount: number;
  totalCount: number;
  completedCount: number;
  lastUpdate: Date | null;
  lastUpdateFormatted: string;
  needsAttention: boolean;
  overdueCount: number;
}

/**
 * Hook for fetching aggregated progress across all 7 life areas
 * Optimized with client-side aggregation for performance
 */
export function useReviewProgress(): {
  data: AreaProgress[] | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  return useQuery({
    queryKey: ['review', 'progress'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all tasks for the user
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('area, progress_percentage, updated_at, due_date')
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      // Map old area names to new standardized names
      const areaMapping: Record<string, AreaType> = {
        // Business areas map to BIZNESS
        'Full Stack': 'BIZNESS',
        'S4': 'BIZNESS',
        '808': 'BIZNESS',
        'Huge Capital': 'BIZNESS',
        'Personal': 'BIZNESS', // Assuming Personal business
        // Other areas
        'Golf': 'GOLF',
        'Health': 'HEALTH',
        'CONTENT': 'CONTENT',
        'FINANCES': 'FINANCES',
        'LIFE': 'LIFE',
        'DAILY': 'DAILY',
      };

      // Group by standardized area and calculate stats
      const areaStats: Record<AreaType, {
        total: number;
        completed: number;
        active: number;
        overdue: number;
        lastUpdate: Date | null;
      }> = {
        DAILY: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
        BIZNESS: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
        CONTENT: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
        HEALTH: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
        FINANCES: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
        LIFE: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
        GOLF: { total: 0, completed: 0, active: 0, overdue: 0, lastUpdate: null },
      };

      (allTasks || []).forEach(task => {
        const mappedArea = areaMapping[task.area] || ('BIZNESS' as AreaType);
        const stats = areaStats[mappedArea];

        stats.total++;
        if (task.progress_percentage === 100) stats.completed++;
        if (task.progress_percentage < 100) stats.active++;

        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.progress_percentage < 100;
        if (isOverdue) stats.overdue++;

        if (task.updated_at) {
          const taskUpdate = new Date(task.updated_at);
          if (!stats.lastUpdate || taskUpdate > stats.lastUpdate) {
            stats.lastUpdate = taskUpdate;
          }
        }
      });

      // Convert to AreaProgress array
      return Object.entries(areaStats).map(([area, stats]) => ({
        area: area as AreaType,
        progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100 * 10) / 10 : 0,
        activeCount: stats.active,
        totalCount: stats.total,
        completedCount: stats.completed,
        lastUpdate: stats.lastUpdate,
        lastUpdateFormatted: stats.lastUpdate
          ? formatDistanceToNow(stats.lastUpdate, { addSuffix: true })
          : 'Never',
        needsAttention: stats.total > 0 && ((stats.completed / stats.total) < 0.33 || stats.overdue > 0),
        overdueCount: stats.overdue,
      })) as AreaProgress[];
    },
    staleTime: 60000, // 1 minute cache for performance
    gcTime: 300000, // 5 minute garbage collection
  });
}
