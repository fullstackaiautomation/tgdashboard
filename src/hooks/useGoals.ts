import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  Goal,
  GoalTarget,
  GoalCheckIn,
  GoalTaskLink,
  GoalWithProgress,
  CreateGoalInput,
  CreateGoalTargetInput,
  CreateGoalCheckInInput,
  LinkTaskToGoalInput,
  GoalArea,
} from '../types/goals'

// ============================================================
// GOALS QUERIES
// ============================================================

// Fetch all goals for user
export const useGoals = (area?: GoalArea, status?: string) => {
  return useQuery({
    queryKey: ['goals', area, status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (area) {
        query = query.eq('area', area)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Goal[]
    },
  })
}

// Fetch single goal with all related data
export const useGoalDetail = (goalId?: string) => {
  return useQuery({
    queryKey: ['goals', goalId],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID required')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user.id)
        .single()

      if (goalError) throw goalError

      // Fetch targets
      const { data: targets, error: targetsError } = await supabase
        .from('goal_targets')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true })

      if (targetsError) throw targetsError

      // Fetch recent check-ins (last 12)
      const { data: checkIns, error: checkInsError } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('goal_id', goalId)
        .order('checkin_date', { ascending: false })
        .limit(12)

      if (checkInsError) throw checkInsError

      // Fetch task links
      const { data: taskLinks, error: linksError } = await supabase
        .from('goal_task_links')
        .select('*')
        .eq('goal_id', goalId)

      if (linksError) throw linksError

      return {
        ...goal,
        targets: targets || [],
        checkIns: checkIns || [],
        taskLinks: taskLinks || [],
      } as GoalWithProgress
    },
    enabled: !!goalId,
  })
}

// ============================================================
// GOAL TARGETS QUERIES
// ============================================================

// Fetch all targets for a goal
export const useGoalTargets = (goalId?: string) => {
  return useQuery({
    queryKey: ['goal_targets', goalId],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID required')

      const { data, error } = await supabase
        .from('goal_targets')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as GoalTarget[]
    },
    enabled: !!goalId,
  })
}

// ============================================================
// CHECK-INS QUERIES
// ============================================================

// Fetch check-ins for a goal
export const useGoalCheckIns = (goalId?: string) => {
  return useQuery({
    queryKey: ['goal_checkins', goalId],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID required')

      const { data, error } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('goal_id', goalId)
        .order('checkin_date', { ascending: false })

      if (error) throw error
      return data as GoalCheckIn[]
    },
    enabled: !!goalId,
  })
}

// Check if user has a pending check-in for today (if Sunday)
export const usePendingCheckIn = (goalId?: string) => {
  return useQuery({
    queryKey: ['pending_checkin', goalId],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID required')

      const today = new Date()
      const dayOfWeek = today.getDay()
      if (dayOfWeek !== 0) return null // Not Sunday

      const sundayDate = new Date(today)
      sundayDate.setDate(today.getDate() - (dayOfWeek || 7))
      const dateStr = sundayDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('goal_checkins')
        .select('*')
        .eq('goal_id', goalId)
        .eq('checkin_date', dateStr)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      return data as GoalCheckIn | null
    },
    enabled: !!goalId,
  })
}

// ============================================================
// MUTATIONS
// ============================================================

// Create goal
export const useCreateGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// Update goal
export const useUpdateGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Goal
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goals', id] })
    },
  })
}

// Delete goal
export const useDeleteGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

// Create goal target
export const useCreateGoalTarget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalTargetInput) => {
      const { data, error } = await supabase
        .from('goal_targets')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as GoalTarget
    },
    onSuccess: (_, { goal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['goal_targets', goal_id] })
      queryClient.invalidateQueries({ queryKey: ['goals', goal_id] })
    },
  })
}

// Update goal target
export const useUpdateGoalTarget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, goal_id, ...updates }: Partial<GoalTarget> & { id: string; goal_id: string }) => {
      const { data, error } = await supabase
        .from('goal_targets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as GoalTarget
    },
    onSuccess: (_, { goal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['goal_targets', goal_id] })
      queryClient.invalidateQueries({ queryKey: ['goals', goal_id] })
    },
  })
}

// Delete goal target
export const useDeleteGoalTarget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (targetId: string) => {
      // Get goal_id first
      const { data: target } = await supabase
        .from('goal_targets')
        .select('goal_id')
        .eq('id', targetId)
        .single()

      const { error } = await supabase
        .from('goal_targets')
        .delete()
        .eq('id', targetId)

      if (error) throw error
      return target?.goal_id
    },
    onSuccess: (goal_id) => {
      if (goal_id) {
        queryClient.invalidateQueries({ queryKey: ['goal_targets', goal_id] })
        queryClient.invalidateQueries({ queryKey: ['goals', goal_id] })
      }
    },
  })
}

// Create check-in
export const useCreateCheckIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalCheckInInput) => {
      const { data, error } = await supabase
        .from('goal_checkins')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as GoalCheckIn
    },
    onSuccess: (_, { goal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['goal_checkins', goal_id] })
      queryClient.invalidateQueries({ queryKey: ['goals', goal_id] })
      queryClient.invalidateQueries({ queryKey: ['pending_checkin', goal_id] })
    },
  })
}

// Link task to goal
export const useLinkTaskToGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: LinkTaskToGoalInput) => {
      const { data, error } = await supabase
        .from('goal_task_links')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as GoalTaskLink
    },
    onSuccess: (_, { goal_id }) => {
      queryClient.invalidateQueries({ queryKey: ['goals', goal_id] })
    },
  })
}

// Unlink task from goal
export const useUnlinkTaskFromGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (linkId: string) => {
      // Get goal_id first
      const { data: link } = await supabase
        .from('goal_task_links')
        .select('goal_id')
        .eq('id', linkId)
        .single()

      const { error } = await supabase
        .from('goal_task_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error
      return link?.goal_id
    },
    onSuccess: (goal_id) => {
      if (goal_id) {
        queryClient.invalidateQueries({ queryKey: ['goals', goal_id] })
      }
    },
  })
}
