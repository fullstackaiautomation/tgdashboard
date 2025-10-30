import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Goal } from '../types/goals'

export interface GoalProgressData {
  goal_id: string
  targets_hit: number
  targets_total: number
  completion_percentage: number
}

// Calculate progress for a single goal based on linked tasks or metric values
export const useGoalProgress = (goal: Goal | null | undefined) => {
  return useQuery({
    queryKey: ['goal_progress', goal?.id],
    queryFn: async () => {
      if (!goal) return null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First, try to calculate progress based on metric values (for metric-based goals)
      if (goal.started_metric_value && goal.check_in_value && goal.primary_metric) {
        try {
          // Parse numeric values, removing any non-numeric characters
          const startValue = parseFloat(goal.started_metric_value.toString().replace(/[^0-9.-]/g, ''))
          const currentValue = parseFloat(goal.check_in_value.toString().replace(/[^0-9.-]/g, ''))
          const goalValue = parseFloat(goal.primary_metric.replace(/[^0-9.-]/g, ''))

          if (!isNaN(startValue) && !isNaN(currentValue) && !isNaN(goalValue)) {
            // For payoff/reduction style goals (where goal is less than start)
            // Progress = (start - current) / (start - goal) * 100
            // For regular goals (where goal is more than start)
            // Progress = (current - start) / (goal - start) * 100

            let progress = 0
            if (goalValue < startValue) {
              // Payoff style: reducing from start toward goal (e.g., $20k -> $0)
              const totalReduction = startValue - goalValue
              const amountPaidOff = startValue - currentValue
              progress = totalReduction > 0 ? (amountPaidOff / totalReduction) * 100 : 0
            } else if (goalValue > startValue) {
              // Growth style: increasing from start toward goal
              const range = goalValue - startValue
              progress = (currentValue - startValue) / range * 100
            } else {
              // Goal equals start, 0% progress
              progress = 0
            }

            const clampedProgress = Math.max(0, Math.min(100, progress)) // Clamp between 0-100

            return {
              goal_id: goal.id,
              targets_hit: Math.round(currentValue),
              targets_total: Math.round(goalValue),
              completion_percentage: Math.round(clampedProgress),
            } as GoalProgressData
          }
        } catch (error) {
          console.error('Error calculating metric-based progress:', error)
        }
      }

      // Fall back to task-based progress calculation
      // Fetch all targets for this goal
      const { data: targets, error: targetsError } = await supabase
        .from('goal_targets')
        .select('*')
        .eq('goal_id', goal.id)

      if (targetsError) throw targetsError

      if (!targets || targets.length === 0) {
        return {
          goal_id: goal.id,
          targets_hit: 0,
          targets_total: 0,
          completion_percentage: 0,
        } as GoalProgressData
      }

      // Fetch linked tasks for this goal
      const { data: links, error: linksError } = await supabase
        .from('goal_task_links')
        .select('task_id, target_id, contribution_type')
        .eq('goal_id', goal.id)

      if (linksError) throw linksError

      if (!links || links.length === 0) {
        return {
          goal_id: goal.id,
          targets_hit: 0,
          targets_total: targets.length,
          completion_percentage: 0,
        } as GoalProgressData
      }

      // Fetch the actual tasks to check if they're completed
      const taskIds = links.map(l => l.task_id)
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, completed_at')
        .in('id', taskIds)

      if (tasksError) throw tasksError

      if (!tasks) {
        return {
          goal_id: goal.id,
          targets_hit: 0,
          targets_total: targets.length,
          completion_percentage: 0,
        } as GoalProgressData
      }

      // Count completed tasks
      const completedTasks = tasks.filter(t => t.status === 'Done').length

      // Calculate percentage based on task completion
      const percentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

      return {
        goal_id: goal.id,
        targets_hit: completedTasks,
        targets_total: tasks.length,
        completion_percentage: Math.round(percentage),
      } as GoalProgressData
    },
    enabled: !!goal,
    staleTime: 5000, // Revalidate every 5 seconds
  })
}

// Calculate overall progress for an area or all areas
export const useAreaGoalsProgress = (area?: string) => {
  return useQuery({
    queryKey: ['area_goals_progress', area],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch all active goals for this area
      let goalsQuery = supabase
        .from('goals')
        .select('id, area')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (area) {
        goalsQuery = goalsQuery.eq('area', area)
      }

      const { data: goals, error: goalsError } = await goalsQuery

      if (goalsError) throw goalsError
      if (!goals || goals.length === 0) {
        return {
          total_goals: 0,
          total_progress: 0,
          goals_on_track: 0,
          average_progress: 0,
        }
      }

      // For each goal, calculate its progress
      let totalProgress = 0
      let goalsOnTrack = 0

      for (const goal of goals) {
        const { data: targets } = await supabase
          .from('goal_targets')
          .select('id')
          .eq('goal_id', goal.id)

        const { data: links } = await supabase
          .from('goal_task_links')
          .select('task_id')
          .eq('goal_id', goal.id)

        if (links && links.length > 0) {
          const taskIds = links.map(l => l.task_id)
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .in('id', taskIds)

          if (tasks) {
            const completedCount = tasks.filter(t => t.status === 'Done').length
            const progress = (completedCount / tasks.length) * 100
            totalProgress += progress

            if (progress >= 75) {
              goalsOnTrack++
            }
          }
        }
      }

      const averageProgress = goals.length > 0 ? Math.round(totalProgress / goals.length) : 0

      return {
        total_goals: goals.length,
        total_progress: totalProgress,
        goals_on_track: goalsOnTrack,
        average_progress: averageProgress,
      }
    },
    staleTime: 5000,
  })
}
