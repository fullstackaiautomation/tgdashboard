import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Project, Phase, CreateProjectDTO, UpdateProjectDTO, CreatePhaseDTO, UpdatePhaseDTO } from '../types/project';

// Projects
export const useProjects = (businessId?: string) => {
  return useQuery({
    queryKey: businessId ? ['projects', 'business', businessId] : ['projects'],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Project[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('projects')
        .select('*, businesses(id, name, color, slug)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project & { businesses: { id: string; name: string; color: string; slug: string } };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProject: CreateProjectDTO) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...newProject, status: newProject.status || 'active' }])
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'business', data.business_id] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProjectDTO }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'business', data.business_id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Phases
export const usePhases = (projectId?: string) => {
  return useQuery({
    queryKey: projectId ? ['phases', 'project', projectId] : ['phases'],
    queryFn: async () => {
      let query = supabase
        .from('phases')
        .select('*')
        .order('sequence_order', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Phase[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePhase = (id: string | undefined) => {
  return useQuery({
    queryKey: ['phases', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('phases')
        .select('*, projects(id, name, business_id)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Phase & { projects: { id: string; name: string; business_id: string } };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePhase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPhase: CreatePhaseDTO) => {
      const { data, error } = await supabase
        .from('phases')
        .insert([{
          ...newPhase,
          status: newPhase.status || 'active',
          sequence_order: newPhase.sequence_order || 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Phase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['phases', 'project', data.project_id] });
    },
  });
};

export const useUpdatePhase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdatePhaseDTO }) => {
      const { data, error } = await supabase
        .from('phases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Phase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      queryClient.invalidateQueries({ queryKey: ['phases', data.id] });
      queryClient.invalidateQueries({ queryKey: ['phases', 'project', data.project_id] });
    },
  });
};

export const useDeletePhase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
    },
  });
};
