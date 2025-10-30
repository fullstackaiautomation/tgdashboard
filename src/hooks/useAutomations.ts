import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Automation, CreateAutomationDTO, UpdateAutomationDTO, AutomationArea } from '../types/automation'

const AUTOMATIONS_KEY = ['automations']

// Fetch all automations for current user
export const useAutomations = (area?: AutomationArea) => {
  return useQuery({
    queryKey: area ? [...AUTOMATIONS_KEY, area] : AUTOMATIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .order('creation_date', { ascending: false })

      if (error) throw error
      return (data as Automation[]).filter(a => !area || a.area === area)
    },
  })
}

// Fetch automations by project
export const useAutomationsByProject = (projectId: string) => {
  return useQuery({
    queryKey: [...AUTOMATIONS_KEY, 'project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('project_id', projectId)
        .order('creation_date', { ascending: false })

      if (error) throw error
      return data as Automation[]
    },
  })
}

// Fetch single automation
export const useAutomation = (id: string) => {
  return useQuery({
    queryKey: [...AUTOMATIONS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Automation
    },
  })
}

// Create automation
export const useCreateAutomation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateAutomationDTO) => {
      // Get current user ID from session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('automations')
        .insert([
          {
            ...dto,
            user_id: user.id,
            integrations: dto.integrations || [],
            completion_level: dto.completion_level || 'Future Idea',
            priority: dto.priority || 'Medium',
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data as Automation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY })
    },
  })
}

// Update automation
export const useUpdateAutomation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string } & UpdateAutomationDTO) => {
      const { data, error } = await supabase
        .from('automations')
        .update(dto)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Automation
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY })
      queryClient.setQueryData([...AUTOMATIONS_KEY, data.id], data)
    },
  })
}

// Delete automation
export const useDeleteAutomation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY })
    },
  })
}

// Update automation completion level (for drag-drop)
export const useUpdateAutomationLevel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completionLevel }: { id: string; completionLevel: string }) => {
      const { data, error } = await supabase
        .from('automations')
        .update({ completion_level: completionLevel })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Automation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTOMATIONS_KEY })
    },
  })
}
