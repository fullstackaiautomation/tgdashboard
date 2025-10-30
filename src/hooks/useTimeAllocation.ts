/**
 * React Query hooks for Time Allocation Analytics
 * Story 4.1: Time Allocation Calculation
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import type { TimeAllocation } from '@/types/deepWork';

interface WeeklyAllocation {
  day_date: string;
  area_name: string;
  hours: number;
  area_type: 'business' | 'life_area' | 'unallocated';
  color: string;
}

interface MonthlyAllocation {
  day_date: string;
  area_name: string;
  hours: number;
  area_type: 'business' | 'life_area' | 'unallocated';
  color: string;
}

interface TimeAllocationWithColors {
  area_id: string | null;
  area_name: string;
  area_type: 'business' | 'life_area' | 'unallocated';
  total_hours: number;
  color: string;
  session_count: number;
}

interface LabelTimeAllocation {
  label: string;
  total_hours: number;
  session_count: number;
}

/**
 * Hook for fetching daily time allocation
 * Returns hours spent per area for a specific date
 */
export function useDailyTimeAllocation(date: Date) {
  return useQuery({
    queryKey: ['time-allocation', 'daily', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('deep_work_log')
        .select('area, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', `${dateStr}T00:00:00`)
        .lt('start_time', `${dateStr}T23:59:59`)
        .not('end_time', 'is', null);

      if (error) throw error;

      // Calculate total hours per area
      const allocation: TimeAllocation = {};
      data?.forEach((session) => {
        const area = session.area || 'Unallocated';
        const hours = (session.duration_minutes || 0) / 60;
        allocation[area] = (allocation[area] || 0) + hours;
      });

      return allocation;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for fetching weekly time allocation
 * Returns hours by area across 7 days
 */
export function useWeeklyTimeAllocation(weekStart: Date) {
  return useQuery({
    queryKey: ['time-allocation', 'weekly', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('start_time, area, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', weekEnd.toISOString())
        .not('end_time', 'is', null);

      if (error) throw error;

      // Group by day and area
      const weeklyData: WeeklyAllocation[] = [];
      data?.forEach((session) => {
        const dayDate = format(new Date(session.start_time), 'yyyy-MM-dd');
        const area = session.area || 'Unallocated';
        const hours = (session.duration_minutes || 0) / 60;

        weeklyData.push({
          day_date: dayDate,
          area_name: area,
          hours,
          area_type: 'unallocated', // Simplified - no business/life_area distinction
          color: '#6B7280', // Default gray color
        });
      });

      return weeklyData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching monthly time allocation trend
 * Returns hours by area across 30 days
 */
export function useMonthlyTimeAllocation(monthStart: Date) {
  return useQuery({
    queryKey: ['time-allocation', 'monthly', format(monthStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const monthEnd = new Date(monthStart);
      monthEnd.setDate(monthEnd.getDate() + 30);

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('start_time, area, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', monthStart.toISOString())
        .lt('start_time', monthEnd.toISOString())
        .not('end_time', 'is', null);

      if (error) throw error;

      // Group by day and area
      const monthlyData: MonthlyAllocation[] = [];
      data?.forEach((session) => {
        const dayDate = format(new Date(session.start_time), 'yyyy-MM-dd');
        const area = session.area || 'Unallocated';
        const hours = (session.duration_minutes || 0) / 60;

        monthlyData.push({
          day_date: dayDate,
          area_name: area,
          hours,
          area_type: 'unallocated',
          color: '#6B7280',
        });
      });

      return monthlyData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching time allocation with color information
 * Useful for rendering colored chips/cards in the UI
 */
export function useTimeAllocationWithColors(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [
      'time-allocation',
      'with-colors',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('area, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .not('end_time', 'is', null);

      if (error) throw error;

      // Aggregate by area
      const areaMap = new Map<string, { total_minutes: number; count: number }>();
      data?.forEach((session) => {
        const area = session.area || 'Unallocated';
        const current = areaMap.get(area) || { total_minutes: 0, count: 0 };
        current.total_minutes += session.duration_minutes || 0;
        current.count += 1;
        areaMap.set(area, current);
      });

      // Convert to array with colors
      const result: TimeAllocationWithColors[] = Array.from(areaMap.entries()).map(
        ([area, stats]) => ({
          area_id: null,
          area_name: area,
          area_type: 'unallocated' as const,
          total_hours: stats.total_minutes / 60,
          color: '#6B7280', // Default gray
          session_count: stats.count,
        })
      );

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching time spent per label
 * Useful for analyzing cross-cutting activities like "$$$ Printer $$$"
 */
export function useTimeByLabel(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: [
      'time-allocation',
      'by-label',
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('labels, duration_minutes')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .not('end_time', 'is', null)
        .not('labels', 'is', null);

      if (error) throw error;

      // Aggregate by label
      const labelMap = new Map<string, { total_minutes: number; count: number }>();
      data?.forEach((session) => {
        session.labels?.forEach((label: string) => {
          const current = labelMap.get(label) || { total_minutes: 0, count: 0 };
          current.total_minutes += session.duration_minutes || 0;
          current.count += 1;
          labelMap.set(label, current);
        });
      });

      // Convert to array
      const result: LabelTimeAllocation[] = Array.from(labelMap.entries()).map(
        ([label, stats]) => ({
          label,
          total_hours: stats.total_minutes / 60,
          session_count: stats.count,
        })
      );

      return result.sort((a, b) => b.total_hours - a.total_hours);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Helper hook to get today's time allocation
 */
export function useTodayTimeAllocation() {
  return useDailyTimeAllocation(new Date());
}

/**
 * Helper hook to get yesterday's time allocation for comparison
 */
export function useYesterdayTimeAllocation() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return useDailyTimeAllocation(yesterday);
}
