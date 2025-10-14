/**
 * Deep Work Session Types
 * Comprehensive types for deep work session tracking and analytics
 */

export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type InterruptionReason =
  | 'Meeting'
  | 'Phone Call'
  | 'Urgent Request'
  | 'Personal'
  | 'Technical Issue'
  | 'Other';

export interface DeepWorkSession {
  id: string;
  user_id: string;

  // Area (simple string approach)
  area: string | null;
  task_type: string | null;
  task_id: string | null;

  // Session details
  session_name: string | null;
  labels: string[];
  start_time: string; // ISO timestamp
  end_time: string | null; // ISO timestamp
  duration_minutes: number | null;
  notes: string | null;

  // Session metadata
  is_planned: boolean;
  was_interrupted: boolean;
  interruption_reason: string | null;
  goal_achieved: boolean | null;
  session_quality_rating: number | null; // 1-5

  // Session status
  status: SessionStatus;
  paused_duration: number; // seconds

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined data (optional, from queries with joins)
  tasks?: {
    id: string;
    task_name: string;
  };
}

export interface CreateDeepWorkSessionInput {
  area?: string | null;
  task_type?: string | null;
  task_id?: string | null;
  session_name?: string | null;
  labels?: string[];
  start_time: string;
  is_planned?: boolean;
  notes?: string | null;
}

export interface UpdateDeepWorkSessionInput {
  area?: string | null;
  task_type?: string | null;
  end_time?: string | null;
  notes?: string | null;
  was_interrupted?: boolean;
  interruption_reason?: string | null;
  goal_achieved?: boolean | null;
  session_quality_rating?: number | null;
  status?: SessionStatus;
  paused_duration?: number;
  labels?: string[];
  // NOTE: duration_minutes is GENERATED, cannot be updated directly
}

// Analytics types
export interface SessionAnalytics {
  total_sessions: number;
  completed_sessions: number;
  avg_session_length_minutes: number;
  median_session_length_minutes: number;
  longest_session_minutes: number;
  shortest_session_minutes: number;
  total_deep_work_hours: number;
  avg_sessions_per_day: number;
  session_length_distribution: {
    under_30min: number;
    '30_to_60min': number;
    '60_to_90min': number;
    '90_to_120min': number;
    over_120min: number;
  };
}

export interface InterruptionAnalysis {
  total_sessions: number;
  interrupted_sessions: number;
  interruption_rate: number; // percentage
  reasons: Record<string, number>; // reason -> count
}

export interface TimeAllocation {
  [areaName: string]: number; // area name -> hours
}

// Filter types
export interface DeepWorkFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  area?: string;
  taskType?: string;
  taskId?: string;
  labels?: string[];
  status?: SessionStatus;
  search?: string;
}
