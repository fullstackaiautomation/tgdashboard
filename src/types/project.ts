export interface Project {
  id: string;
  user_id: string;
  business_id: string;
  name: string;
  description: string | null;
  status: string;
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
  status?: string;
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
