import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { AreaVision, CreateAreaVisionInput, GoalArea } from '../types/goals'

// ============================================================
// QUERIES
// ============================================================

// Fetch area vision for a specific area
export const useAreaVision = (area?: GoalArea) => {
  return useQuery({
    queryKey: ['area_vision', area],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !area) return null

      const { data, error } = await supabase
        .from('area_visions')
        .select('*')
        .eq('user_id', user.id)
        .eq('area', area)
        .single()

      // Return null if no vision exists (not an error)
      if (error && error.code === 'PGRST116') return null
      if (error) throw error

      return data as AreaVision
    },
    enabled: !!area,
  })
}

// Fetch all area visions for user
export const useAllAreaVisions = () => {
  return useQuery({
    queryKey: ['area_visions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('area_visions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AreaVision[]
    },
  })
}

// ============================================================
// MUTATIONS
// ============================================================

// Create or update area vision
export const useUpsertAreaVision = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAreaVisionInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('area_visions')
        .upsert({
          user_id: user.id,
          area: input.area,
          vision_statement: input.vision_statement,
        })
        .select()
        .single()

      if (error) throw error
      return data as AreaVision
    },
    onSuccess: (_, { area }) => {
      queryClient.invalidateQueries({ queryKey: ['area_vision', area] })
      queryClient.invalidateQueries({ queryKey: ['area_visions'] })
    },
  })
}

// Delete area vision
export const useDeleteAreaVision = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (area: GoalArea) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('area_visions')
        .delete()
        .eq('user_id', user.id)
        .eq('area', area)

      if (error) throw error
    },
    onSuccess: (_, area) => {
      queryClient.invalidateQueries({ queryKey: ['area_vision', area] })
      queryClient.invalidateQueries({ queryKey: ['area_visions'] })
    },
  })
}
