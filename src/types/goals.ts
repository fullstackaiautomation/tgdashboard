// Goals & Progress Tracking Types

export type GoalArea = 'Health' | 'Relationships' | 'Finance' | 'Full Stack' | 'Huge Capital' | 'S4'

export type GoalStatus = 'active' | 'achieved' | 'paused' | 'abandoned'

export type MetricType = 'numeric' | 'qualitative'

export type TargetFrequency = 'daily' | 'weekly' | 'monthly'

export type ContributionType = 'count' | 'duration' | 'metric'

// Main Goal entity
export interface Goal {
  id: string
  user_id: string
  area: GoalArea
  goal_statement: string
  target_date: string // DATE format YYYY-MM-DD
  primary_metric: string // e.g., "10-15% body fat"
  metric_unit?: string // e.g., "%", "lbs", "$"
  metric_type: MetricType
  status: GoalStatus
  created_at: string
  updated_at: string
}

// Weekly/Monthly targets within a goal
export interface GoalTarget {
  id: string
  goal_id: string
  target_name: string // e.g., "Workout 4x/week"
  frequency: TargetFrequency
  target_value: number // e.g., 4
  target_unit?: string // e.g., "count", "min", "pounds"
  contribution_type: ContributionType // how does task feed into this?
  created_at: string
  updated_at: string
}

// Link between goals and tasks for automatic progress tracking
export interface GoalTaskLink {
  id: string
  goal_id: string
  task_id: string
  target_id?: string
  contribution_type: ContributionType
  created_at: string
}

// Weekly check-in record (submitted every Sunday)
export interface GoalCheckIn {
  id: string
  goal_id: string
  checkin_date: string // DATE format YYYY-MM-DD (always Sunday)
  targets_hit?: number // how many targets were hit
  targets_total?: number // total targets for the week
  overall_percentage?: number // (targets_hit / targets_total) * 100
  metric_snapshot?: Record<string, unknown> // JSONB snapshot of metrics
  qualitative_feedback?: string // user's notes about the week
  feeling_question?: string // answer to "How are you feeling this week?"
  sustainability_question?: string // "Is this sustainable?" (yes/no/adjust)
  obstacles_notes?: string // challenges or wins
  created_at: string
}

// Goal with related data (for detail view)
export interface GoalWithProgress extends Goal {
  targets: GoalTarget[]
  checkIns?: GoalCheckIn[]
  taskLinks?: GoalTaskLink[]
  currentProgress?: GoalProgress
}

// Current progress status for a goal
export interface GoalProgress {
  goal_id: string
  targets_hit: number
  targets_total: number
  completion_percentage: number
}

// Weekly target with current completion status
export interface TargetProgress {
  target_id: string
  target_name: string
  target_value: number
  target_unit?: string
  completed_count: number
  completion_percentage: number
}

// For form submissions
export interface CreateGoalInput {
  area: GoalArea
  goal_statement: string
  target_date: string
  primary_metric: string
  metric_unit?: string
  metric_type: MetricType
}

export interface CreateGoalTargetInput {
  goal_id: string
  target_name: string
  frequency: TargetFrequency
  target_value: number
  target_unit?: string
  contribution_type: ContributionType
}

export interface CreateGoalCheckInInput {
  goal_id: string
  checkin_date: string
  targets_hit?: number
  targets_total?: number
  overall_percentage?: number
  metric_snapshot?: Record<string, unknown>
  qualitative_feedback?: string
  feeling_question?: string
  sustainability_question?: string
  obstacles_notes?: string
}

export interface LinkTaskToGoalInput {
  goal_id: string
  task_id: string
  target_id?: string
  contribution_type: ContributionType
}
