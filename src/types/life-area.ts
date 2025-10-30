export interface LifeArea {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLifeAreaDTO {
  name: string;
  category: string;
  color: string;
  description?: string;
}

export interface UpdateLifeAreaDTO {
  name?: string;
  category?: string;
  color?: string;
  description?: string;
}
