export type ContentSource = 'Website' | 'Twitter' | 'YouTube' | 'Instagram' | 'Other'

export type ContentPlatform = ContentSource // Alias for new naming

export type ContentCategory =
  | 'Full Stack Development'
  | 'AI Build'
  | 'Business & Entrepreneurship'
  | 'Finance & Investing'
  | 'Marketing & Sales'
  | 'Personal Development'
  | 'Health & Fitness'
  | 'Golf'
  | 'Productivity'
  | 'Design'
  | 'Leadership'
  | 'Other'

export type ContentStatus = 'To Watch' | 'In Progress' | 'Completed' | 'Implementing' | 'Archived' | 'Vault'

export type ContentPriority = 'High' | 'Medium' | 'Low'

export interface ContentItem {
  id: string
  user_id: string
  title: string
  url: string
  thumbnail_url?: string
  source: ContentSource
  category: ContentCategory
  subcategories?: string[]
  status: ContentStatus
  priority: ContentPriority
  notes: string
  ai_summary?: string // AI-generated content summary
  key_takeaways?: string[]
  action_items?: string[]
  tags: string[]
  dashboard_areas?: string[] // Business UUIDs or life area strings (Health, Life, Finance, Golf)
  agent?: string // Agent name or identifier
  saved_at: string
  completed_at?: string | null
  time_to_consume?: number | null // in minutes (legacy field)
  time_estimate?: string // time estimate string (e.g., "10 min", "1 hour")
  creator?: string
  rating?: number | null // 1-5 stars (legacy field)
  value_rating?: number | null // 1-10 value rating
  tg_rating?: number | null // 1-10 TG rating
  google_llm?: boolean // Yes/No for Google LLM
  is_favorite: boolean
  folder?: string
  created_at: string
  updated_at: string
}

export interface ContentFilter {
  source?: ContentSource[]
  category?: ContentCategory[]
  status?: ContentStatus[]
  priority?: ContentPriority[]
  tags?: string[]
  folder?: string
  searchTerm?: string
  isFavorite?: boolean
  dashboardAreas?: string[] // Filter by dashboard areas
  minValueRating?: number | null // Minimum value rating (1-10)
  dateRange?: {
    start: string
    end: string
  }
}
