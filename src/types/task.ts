import type { Business } from './business';
import type { Project, Phase } from './project';
import type { LifeArea } from './life-area';

export type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health'

export const DEFAULT_TASK_TYPES: Record<Area, string[]> = {
  'Personal': ['Friends', 'House', 'Finances', 'Life', 'Car', 'Arya', 'Cheypow'],
  'Full Stack': ['Team', 'New Build', 'New Product Demo', 'Update Build', 'Admin'],
  'Huge Capital': ['Marketing', 'Admin', 'New Build', 'Planning'],
  '808': ['Cost Savings', 'Fulfillment', 'Data', 'Customer Service', '808 Online', 'Artists'],
  'S4': ['Sales', 'Marketing', 'New Automation', 'Update Automation', 'Data'],
  'Golf': ['Golfing', 'Equipment', 'Content', 'Automation'],
  'Health': ['Strength', 'Yoga', 'Meditation', 'Read', 'Walk']
}

export type TaskType = string

export type TaskStatus = 'Not started' | 'In progress' | 'Done'

export type Priority = 'Low' | 'Medium' | 'High'

export type EffortLevel = '$$$ Printer $$$' | '$ Makes Money $' | '-$ Save Dat $-' | ':( No Money ):' | '8) Vibing (8'

export type Automation = 'Automate' | 'Manual' | 'Delegate'

export type RecurringType = 'none' | 'daily' | 'daily_weekdays' | 'weekly' | 'monthly' | 'custom'

export type EnergyLevel = 'Deep Work' | 'Mild Focus' | 'Admin'

export type EstimationAccuracy = 'Overestimated' | 'Underestimated' | 'Accurate'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

// Original Task interface (for TodoList backward compatibility - uses Date objects)
export interface Task {
  id: string
  task_name: string
  description: string
  area: Area
  task_type: TaskType
  status: TaskStatus
  automation: Automation
  priority: Priority
  effort_level: EffortLevel
  due_date: Date | null
  completed_at: Date | null
  past_due: boolean
  created_at: Date
  updated_at: Date
  checklist: ChecklistItem[]
  recurring_type: RecurringType
  recurring_interval: number
  is_recurring_template: boolean
  hours_projected: number | null
  hours_worked: number | null
}

// New TaskHub interface with relationships (for Tasks Hub - uses string dates from Supabase)
export interface TaskHub {
  id: string
  user_id: string
  task_name: string
  description: string | null

  // Legacy area field (for backward compatibility)
  area: Area | null
  task_type: TaskType | null

  status: TaskStatus
  automation: Automation | null
  priority: Priority
  effort_level: EffortLevel | null
  progress_percentage: number

  // Relationships (nullable - task can be business OR life area)
  business_id: string | null
  project_id: string | null
  phase_id: string | null

  // Joined relations (from Supabase queries)
  businesses?: Business
  projects?: Project
  phases?: Phase
  life_areas?: LifeArea

  // Time tracking (string dates from Supabase)
  due_date: string | null
  completed_at: string | null
  past_due: boolean
  hours_projected: number | null
  hours_worked: number | null

  // Daily scheduling
  scheduled_date: string | null
  scheduled_time: string | null
  recurrence_pattern: RecurringType | null
  recurrence_parent_id: string | null

  // Recurring tasks
  recurring_type: RecurringType
  recurring_interval: number
  recurring_parent_id: string | null
  is_recurring_template: boolean

  // Checklist
  checklist: ChecklistItem[]

  // Metadata fields
  energy_level: EnergyLevel | null
  hours_accuracy: number | null
  estimation_accuracy: EstimationAccuracy | null

  // Timestamps (string dates from Supabase)
  created_at: string
  updated_at: string
}

export interface CreateTaskDTO {
  // Note: user_id is automatically added by useCreateTask hook from auth session
  task_name: string
  description?: string
  status?: TaskStatus
  priority?: Priority
  progress_percentage?: number

  // Relationships
  business_id?: string
  project_id?: string
  phase_id?: string

  // Legacy fields
  area?: Area
  task_type?: TaskType
  automation?: Automation
  effort_level?: EffortLevel

  // Time tracking
  due_date?: string
  hours_projected?: number

  // Daily scheduling
  scheduled_date?: string
  scheduled_time?: string
  recurrence_pattern?: RecurringType
  recurrence_parent_id?: string

  // Recurring
  recurring_type?: RecurringType
  recurring_interval?: number
  is_recurring_template?: boolean
  recurring_parent_id?: string

  // Metadata fields
  energy_level?: EnergyLevel
  hours_accuracy?: number
  estimation_accuracy?: EstimationAccuracy
}

export interface UpdateTaskDTO {
  task_name?: string
  description?: string | null
  status?: TaskStatus
  priority?: Priority
  progress_percentage?: number

  // Relationships
  business_id?: string | null
  project_id?: string | null
  phase_id?: string | null

  // Legacy fields
  area?: Area | null
  task_type?: TaskType | null
  automation?: Automation | null
  effort_level?: EffortLevel | null

  // Time tracking
  due_date?: string | null
  completed_at?: string | null
  past_due?: boolean
  hours_projected?: number | null
  hours_worked?: number | null

  // Daily scheduling
  scheduled_date?: string | null
  scheduled_time?: string | null
  recurrence_pattern?: RecurringType | null
  recurrence_parent_id?: string | null

  // Recurring
  recurring_type?: RecurringType | null
  recurring_interval?: number | null

  // Metadata fields
  energy_level?: EnergyLevel | null
  hours_accuracy?: number | null
  estimation_accuracy?: EstimationAccuracy | null

  // Checklist
  checklist?: ChecklistItem[]
}
