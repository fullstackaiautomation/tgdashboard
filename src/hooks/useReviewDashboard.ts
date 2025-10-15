// Story 5.1: Review Dashboard Hook
// Aggregates data from all 7 areas with intelligent caching

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { calculatePriorityLevel, needsAttention as checkNeedsAttention, type PriorityLevel } from '../utils/areaPriority';
import type { AreaType } from '../config/reviewNavigation';

export interface AreaSummary {
  area: AreaType;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  progressPercentage: number;
  lastUpdated: Date | null;
  lastUpdatedFormatted: string;
  hoursThisWeek: number;
  needsAttention: boolean;
  priorityLevel: PriorityLevel;
}

interface RawAreaData {
  area: string;
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  overdue_tasks: number;
  progress_percentage: number;
  last_updated: string | null;
  hours_this_week: number;
}

/**
 * Hook to fetch and cache review dashboard data
 * Implements Tasks 2, 3, and 10 from Story 5.1
 *
 * Features:
 * - Single aggregation query for all 7 areas
 * - Intelligent caching (1 min stale, 5 min gc)
 * - Auto-refetch every 2 minutes
 * - Priority calculation and sorting
 * - Error handling with graceful degradation
 */
export const useReviewDashboard = () => {
  return useQuery<AreaSummary[], Error>({
    queryKey: ['review', 'dashboard'],
    queryFn: async () => {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Authentication failed');
      if (!user) throw new Error('Not authenticated');

      // Call aggregation function
      const { data, error } = await supabase.rpc('get_review_dashboard_summary', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Review dashboard query error:', error);
        throw error;
      }

      console.log('Raw review dashboard data:', data);

      // Map database area names to review area types
      const areaMapping: Record<string, AreaType> = {
        'Full Stack': 'BIZNESS',
        'S4': 'BIZNESS',
        '808': 'BIZNESS',
        'Huge Capital': 'BIZNESS',
        'Personal': 'DAILY',
        'Golf': 'GOLF',
        'Health': 'HEALTH',
      };

      // Group data by review area type
      const groupedData: Record<AreaType, RawAreaData[]> = {
        DAILY: [],
        BIZNESS: [],
        CONTENT: [],
        HEALTH: [],
        FINANCES: [],
        LIFE: [],
        GOLF: [],
      };

      // Group raw data
      (data as RawAreaData[] || []).forEach((area) => {
        const mappedArea = areaMapping[area.area];
        if (mappedArea && groupedData[mappedArea]) {
          groupedData[mappedArea].push(area);
        }
      });

      // Aggregate each review area
      const enrichedAreas: AreaSummary[] = Object.entries(groupedData).map(([areaType, areas]) => {
        if (areas.length === 0) {
          // Return empty area summary
          return {
            area: areaType as AreaType,
            totalTasks: 0,
            completedTasks: 0,
            activeTasks: 0,
            overdueTasks: 0,
            progressPercentage: 0,
            lastUpdated: null,
            lastUpdatedFormatted: 'Never',
            hoursThisWeek: 0,
            needsAttention: false,
            priorityLevel: 'normal' as PriorityLevel,
          };
        }

        // Aggregate metrics across all areas in this group
        const totalTasks = areas.reduce((sum, a) => sum + a.total_tasks, 0);
        const completedTasks = areas.reduce((sum, a) => sum + a.completed_tasks, 0);
        const activeTasks = areas.reduce((sum, a) => sum + a.active_tasks, 0);
        const overdueTasks = areas.reduce((sum, a) => sum + a.overdue_tasks, 0);
        const hoursThisWeek = areas.reduce((sum, a) => sum + (a.hours_this_week || 0), 0);

        // Calculate weighted average progress
        const progressPercentage = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

        // Get most recent update
        const lastUpdated = areas
          .map(a => a.last_updated ? new Date(a.last_updated) : null)
          .filter((d): d is Date => d !== null)
          .sort((a, b) => b.getTime() - a.getTime())[0] || null;

        // Calculate priority level
        const priorityLevel = calculatePriorityLevel({
          progressPercentage,
          overdueTasks,
          lastUpdated,
        });

        return {
          area: areaType as AreaType,
          totalTasks,
          completedTasks,
          activeTasks,
          overdueTasks,
          progressPercentage,
          lastUpdated,
          lastUpdatedFormatted: lastUpdated
            ? formatDistanceToNow(lastUpdated, { addSuffix: true })
            : 'Never',
          hoursThisWeek: Math.round(hoursThisWeek * 10) / 10, // Round to 1 decimal
          needsAttention: checkNeedsAttention(priorityLevel),
          priorityLevel,
        } as AreaSummary;
      });

      console.log('Enriched areas:', enrichedAreas);

      // Sort by priority (critical first, then warning, then normal)
      return enrichedAreas.sort((a, b) => {
        const priorityOrder = { critical: 0, warning: 1, normal: 2 };
        return priorityOrder[a.priorityLevel] - priorityOrder[b.priorityLevel];
      });
    },
    // Caching strategy (Task 3)
    staleTime: 60000, // 1 minute - data considered fresh
    gcTime: 300000, // 5 minutes - keep in cache
    refetchInterval: 120000, // Auto-refetch every 2 minutes in background
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always fetch fresh data on mount
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1s between retries
  });
};

/**
 * Hook to get summary statistics across all areas
 */
export const useReviewSummary = () => {
  const { data: areas } = useReviewDashboard();

  if (!areas || areas.length === 0) {
    return {
      totalCritical: 0,
      totalWarning: 0,
      hasAttentionNeeded: false,
      allClear: true,
    };
  }

  const totalCritical = areas.filter(a => a.priorityLevel === 'critical').length;
  const totalWarning = areas.filter(a => a.priorityLevel === 'warning').length;
  const hasAttentionNeeded = areas.some(a => a.needsAttention);
  const allClear = !hasAttentionNeeded;

  return {
    totalCritical,
    totalWarning,
    hasAttentionNeeded,
    allClear,
  };
};
