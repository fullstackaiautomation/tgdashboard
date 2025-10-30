/**
 * useTaskBasedPlanning - Integrate actual tasks with time allocation planning
 *
 * Calculates time allocation needs based on real task estimates
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Area } from '@/types/planning';

interface TaskTimeAllocation {
  area: Area;
  total_projected_hours: number;
  task_count: number;
  completed_hours: number;
  remaining_hours: number;
  tasks: Array<{
    id: string;
    task_name: string;
    hours_projected: number;
    hours_worked: number;
    status: string;
    due_date: string | null;
  }>;
}

/**
 * useTaskBasedTimeAllocation - Calculate time needed based on actual tasks
 */
export const useTaskBasedTimeAllocation = () => {
  return useQuery({
    queryKey: ['task-based-allocation'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all active tasks with time estimates
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, task_name, area, hours_projected, hours_worked, status, due_date')
        .eq('user_id', user.id)
        .in('status', ['active', 'in_progress'])
        .not('hours_projected', 'is', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Group by area and calculate totals
      const areaMap = new Map<Area, TaskTimeAllocation>();

      const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

      // Initialize all areas
      AREAS.forEach(area => {
        areaMap.set(area, {
          area,
          total_projected_hours: 0,
          task_count: 0,
          completed_hours: 0,
          remaining_hours: 0,
          tasks: [],
        });
      });

      // Aggregate task data
      tasks?.forEach(task => {
        const area = task.area as Area;
        if (!areaMap.has(area)) return;

        const allocation = areaMap.get(area)!;
        const projected = task.hours_projected || 0;
        const worked = task.hours_worked || 0;
        const remaining = Math.max(0, projected - worked);

        allocation.total_projected_hours += projected;
        allocation.completed_hours += worked;
        allocation.remaining_hours += remaining;
        allocation.task_count += 1;
        allocation.tasks.push({
          id: task.id,
          task_name: task.task_name,
          hours_projected: projected,
          hours_worked: worked,
          status: task.status,
          due_date: task.due_date,
        });
      });

      return Array.from(areaMap.values()).filter(a => a.task_count > 0);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * useSmartTargetSuggestions - Suggest weekly targets based on task workload
 */
export const useSmartTargetSuggestions = () => {
  const { data: taskAllocation } = useTaskBasedTimeAllocation();

  return useQuery({
    queryKey: ['smart-target-suggestions', taskAllocation],
    queryFn: async () => {
      if (!taskAllocation) return [];

      const suggestions = taskAllocation.map(allocation => {
        // Calculate weeks needed to complete all tasks
        const weeksAvailable = 4; // Default planning window
        const weeklyHoursNeeded = Math.ceil(allocation.remaining_hours / weeksAvailable);

        return {
          area: allocation.area,
          suggested_target: weeklyHoursNeeded,
          reasoning: `${allocation.task_count} active task${allocation.task_count > 1 ? 's' : ''} need ${allocation.remaining_hours.toFixed(1)}h total`,
          task_breakdown: allocation.tasks,
          urgency: allocation.tasks.some(t => t.due_date) ? 'high' : 'medium',
        };
      });

      return suggestions.sort((a, b) => b.suggested_target - a.suggested_target);
    },
    enabled: !!taskAllocation,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * useWeeklyCapacityCheck - Compare task workload vs available capacity
 */
export const useWeeklyCapacityCheck = (availableHours: number) => {
  const { data: suggestions } = useSmartTargetSuggestions();

  return useQuery({
    queryKey: ['capacity-check', availableHours, suggestions],
    queryFn: async () => {
      if (!suggestions) return null;

      const totalNeeded = suggestions.reduce((sum, s) => sum + s.suggested_target, 0);
      const capacityUtilization = (totalNeeded / availableHours) * 100;

      return {
        total_hours_needed: totalNeeded,
        available_hours: availableHours,
        utilization_percentage: capacityUtilization,
        is_overloaded: capacityUtilization > 100,
        shortage: Math.max(0, totalNeeded - availableHours),
        recommendations: capacityUtilization > 100
          ? [
              'Consider extending timeline for some tasks',
              'Delegate or defer low-priority tasks',
              `Need ${(totalNeeded - availableHours).toFixed(1)}h more capacity`,
            ]
          : [
              'Workload is manageable within available hours',
              `${(availableHours - totalNeeded).toFixed(1)}h available for new work`,
            ],
      };
    },
    enabled: !!suggestions && availableHours > 0,
    staleTime: 5 * 60 * 1000,
  });
};
