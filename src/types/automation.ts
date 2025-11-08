export type AutomationPurpose = 'Sales' | 'Data' | 'Fulfillment' | 'Marketing' | 'Admin'

export type AutomationArea = 'Full Stack' | 'Huge Capital' | 'S4' | '808' | 'Personal' | 'Health' | 'Golf'

export type AutomationLabel = 'MCP' | 'Skills' | 'Agents' | 'Workflow'

export type AutomationPlatform = 'n8n' | 'Zapier' | 'Claude Web' | 'Claude Code'

export type AutomationTrigger = 'Auto' | 'Manual'

export type CompletionLevel = 'Future Idea' | 'Planning' | 'In Progress' | 'Review' | 'Completed'

export type Priority = 'Low' | 'Medium' | 'High'

export type Integration =
  | 'Asana'
  | 'Excel'
  | 'Google Sheets'
  | 'Gmail'
  | 'Google Drive'
  | 'Claude'
  | 'Slack'
  | 'Shopify'
  | 'GHL'
  | 'CBOS'
  | 'Klaviyo'
  | 'Dashboard'

export interface Automation {
  id: string
  user_id: string

  // Core fields
  name: string
  purpose: AutomationPurpose
  area: AutomationArea
  label: AutomationLabel
  platform: AutomationPlatform
  trigger_type: AutomationTrigger

  // Multi-select integrations
  integrations: Integration[]

  // Status and priority
  completion_level: CompletionLevel
  priority: Priority

  // Dates
  creation_date: string
  go_live_date: string | null
  last_checked_date: string | null

  // Metadata
  created_at: string
  updated_at: string
}

export interface CreateAutomationDTO {
  name: string
  purpose: AutomationPurpose
  area: AutomationArea
  label: AutomationLabel
  platform: AutomationPlatform
  trigger_type: AutomationTrigger
  integrations?: Integration[]
  completion_level?: CompletionLevel
  priority?: Priority
  go_live_date?: string | null
  last_checked_date?: string | null
}

export interface UpdateAutomationDTO {
  name?: string
  purpose?: AutomationPurpose
  area?: AutomationArea
  label?: AutomationLabel
  platform?: AutomationPlatform
  trigger_type?: AutomationTrigger
  integrations?: Integration[]
  completion_level?: CompletionLevel
  priority?: Priority
  go_live_date?: string | null
  last_checked_date?: string | null
}

export const AUTOMATION_PURPOSES: AutomationPurpose[] = ['Sales', 'Data', 'Fulfillment', 'Marketing', 'Admin']

export const AUTOMATION_AREAS: AutomationArea[] = ['Full Stack', 'Huge Capital', 'S4', '808', 'Personal', 'Health', 'Golf']

export const AUTOMATION_LABELS: AutomationLabel[] = ['MCP', 'Skills', 'Agents', 'Workflow']

export const AUTOMATION_PLATFORMS: AutomationPlatform[] = ['n8n', 'Zapier', 'Claude Web', 'Claude Code']

export const AUTOMATION_TRIGGERS: AutomationTrigger[] = ['Auto', 'Manual']

export const COMPLETION_LEVELS: CompletionLevel[] = ['Future Idea', 'Planning', 'In Progress', 'Review', 'Completed']

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High']

export const AVAILABLE_INTEGRATIONS: Integration[] = [
  'Asana',
  'Excel',
  'Google Sheets',
  'Gmail',
  'Google Drive',
  'Claude',
  'Slack',
  'Shopify',
  'GHL',
  'CBOS',
  'Klaviyo',
  'Dashboard',
]

// Color mappings for UI - using darker saturated colors to match cards
export const COMPLETION_LEVEL_COLORS: Record<CompletionLevel, string> = {
  'Future Idea': 'bg-[rgb(85,45,120)]',      // Dark purple (matches card background)
  'Planning': 'bg-[rgb(35,70,130)]',         // Dark blue (matches card background)
  'In Progress': 'bg-[rgb(120,95,35)]',      // Dark yellow (matches card background)
  'Review': 'bg-[rgb(130,65,25)]',           // Dark orange (matches card background)
  'Completed': 'bg-[rgb(25,95,75)]',         // Dark green (matches card background)
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  'Low': 'bg-blue-500',
  'Medium': 'bg-yellow-500',
  'High': 'bg-red-500',
}

export const PURPOSE_COLORS: Record<AutomationPurpose, string> = {
  'Sales': 'bg-green-600',
  'Data': 'bg-blue-600',
  'Fulfillment': 'bg-orange-600',
  'Marketing': 'bg-purple-600',
  'Admin': 'bg-gray-600',
}

export const LABEL_COLORS: Record<AutomationLabel, string> = {
  'MCP': 'bg-pink-600',
  'Skills': 'bg-orange-600',
  'Agents': 'bg-red-600',
  'Workflow': 'bg-blue-400',
}

export const PLATFORM_COLORS: Record<AutomationPlatform, string> = {
  'n8n': 'bg-purple-600',
  'Zapier': 'bg-orange-400',
  'Claude Web': 'bg-orange-600',
  'Claude Code': 'bg-orange-800',
}

export const TRIGGER_COLORS: Record<AutomationTrigger, string> = {
  'Auto': 'bg-green-600',
  'Manual': 'bg-orange-600',
}

export const INTEGRATION_COLORS: Record<Integration, string> = {
  'Asana': 'bg-pink-600',
  'Excel': 'bg-green-800',
  'Google Sheets': 'bg-green-500',
  'Gmail': 'bg-red-600',
  'Google Drive': 'bg-red-600',
  'Claude': 'bg-orange-600',
  'Slack': 'bg-purple-600',
  'Shopify': 'bg-green-500',
  'GHL': 'bg-blue-700',
  'CBOS': 'bg-blue-600',
  'Klaviyo': 'bg-yellow-500',
  'Dashboard': 'bg-blue-600',
}

export const AREA_COLORS: Record<AutomationArea, string> = {
  'Full Stack': 'bg-[rgb(25,95,75)]',      // darker green
  'Huge Capital': 'bg-[rgb(85,45,120)]',   // darker purple
  'S4': 'bg-[rgb(35,70,130)]',             // darker blue
  '808': 'bg-[rgb(120,95,35)]',            // darker yellow/gold
  'Personal': 'bg-[rgb(120,45,85)]',       // darker pink
  'Health': 'bg-[rgb(25,90,85)]',          // darker teal
  'Golf': 'bg-[rgb(130,65,25)]',           // darker orange
}
