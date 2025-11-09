export interface Project {
  id: string;
  user_id: string;
  business_id: string;
  name: string;
  description: string | null;
  notes: string | null;
  status: string;
  project_goal: string | null;
  project_automations: string | null;
  automation_ids: string[] | null;
  project_start_date: string | null;
  project_estimated_completion: string | null;
  project_completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDTO {
  business_id: string;
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  notes?: string;
  status?: string;
  project_goal?: string;
  project_automations?: string;
  automation_ids?: string[] | null;
  project_start_date?: string | null;
  project_estimated_completion?: string | null;
  project_completion_date?: string | null;
}

export interface CreatePhaseDTO {
  project_id: string;
  name: string;
  description?: string;
  status?: string;
  sequence_order?: number;
}

export interface UpdatePhaseDTO {
  name?: string;
  description?: string;
  status?: string;
  sequence_order?: number;
}
