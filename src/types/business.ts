export interface Business {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessDTO {
  name: string;
  slug: string;
  color: string;
  description?: string;
}

export interface UpdateBusinessDTO {
  name?: string;
  slug?: string;
  color?: string;
  description?: string;
}
