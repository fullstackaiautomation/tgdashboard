import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Goal } from '../types/goals'

// Get Sunday date for a given date
function getSundayDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  const sunday = new Date(d.setDate(diff))
  return sunday.toISOString().split('T')[0]
}

// Check if today is Sunday
function isToday(date: Date = new Date()): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// Get goals that need check-ins today (if today is Sunday)
export const useGoalsNeedingCheckIn = (enabled = true) => {
  return useQuery({
    queryKey: ['goals_needing_checkin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const today = new Date()
      const isCurrentlySunday = today.getDay() === 0

      if (!isCurrentlySunday) {
        return { isCheckInDay: false, goals: [] }
      }

      const sundayDateStr = getSundayDate(today)

      // Fetch all active goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (goalsError) throw goalsError
      if (!goals) return { isCheckInDay: true, goals: [] }

      // For each goal, check if a check-in exists for this Sunday
      const goalsNeedingCheckIn: Goal[] = []

      for (const goal of goals) {
        const { data: existingCheckIn } = await supabase
          .from('goal_checkins')
          .select('id')
          .eq('goal_id', goal.id)
          .eq('checkin_date', sundayDateStr)
          .single()

        // If no check-in exists, add to list
        if (!existingCheckIn) {
          goalsNeedingCheckIn.push(goal)
        }
      }

      return {
        isCheckInDay: true,
        goals: goalsNeedingCheckIn,
        sundayDate: sundayDateStr,
      }
    },
    enabled: enabled,
    staleTime: 60000, // Only check once per minute
  })
}

// Get past check-ins for a goal
export const useCheckInHistory = (goalId?: string) => {
  return useQuery({
    queryKey: ['checkin_history', goalId],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID required')

      const { data, error } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('goal_id', goalId)
        .order('checkin_date', { ascending: false })
        .limit(12)

      if (error) throw error
      return data || []
    },
    enabled: !!goalId,
  })
}

// Get monthly check-in summary
export const useMonthlyCheckInSummary = (goalId?: string, year?: number, month?: number) => {
  return useQuery({
    queryKey: ['monthly_checkin_summary', goalId, year, month],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID required')

      const now = new Date()
      const targetYear = year || now.getFullYear()
      const targetMonth = month !== undefined ? month : now.getMonth()

      // Get first and last day of month
      const startDate = new Date(targetYear, targetMonth, 1).toISOString().split('T')[0]
      const endDate = new Date(targetYear, targetMonth + 1, 0).toISOString().split('T')[0]

      const { data: checkIns, error } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('goal_id', goalId)
        .gte('checkin_date', startDate)
        .lte('checkin_date', endDate)
        .order('checkin_date', { ascending: true })

      if (error) throw error

      if (!checkIns || checkIns.length === 0) {
        return {
          checkIns: [],
          averageProgress: 0,
          totalCheckIns: 0,
          bestWeek: null,
          trend: 'stable',
        }
      }

      const totalProgress = checkIns.reduce((sum, ci) => sum + (ci.overall_percentage || 0), 0)
      const averageProgress = Math.round(totalProgress / checkIns.length)
      const bestWeek = checkIns.reduce((best, ci) =>
        (ci.overall_percentage || 0) > (best.overall_percentage || 0) ? ci : best
      )

      // Determine trend
      const firstHalf = checkIns.slice(0, Math.ceil(checkIns.length / 2))
      const secondHalf = checkIns.slice(Math.ceil(checkIns.length / 2))
      const firstHalfAvg = firstHalf.reduce((sum, ci) => sum + (ci.overall_percentage || 0), 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, ci) => sum + (ci.overall_percentage || 0), 0) / secondHalf.length

      let trend = 'stable'
      if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving'
      if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining'

      return {
        checkIns,
        averageProgress,
        totalCheckIns: checkIns.length,
        bestWeek,
        trend,
      }
    },
    enabled: !!goalId,
  })
}
