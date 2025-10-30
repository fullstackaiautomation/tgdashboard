/**
 * Planning types for Story 4.5: Time Allocation Targets & Planning
 */

export type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health';

export interface AreaTimeTarget {
  id: string;
  user_id: string;
  area: Area;
  target_hours_per_week: number;
  temporary_target_override: number | null;
  override_start_date: string | null;
  override_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  available_work_hours_per_week: number;
  created_at: string;
  updated_at: string;
}

export interface PlannedVsActual {
  area: Area;
  target_hours: number;
  actual_hours: number;
  percentage: number;
  status: 'no_target' | 'on_track' | 'at_risk' | 'behind';
  is_temporary_override: boolean;
}

export interface WeeklyForecast {
  area: Area;
  target_hours: number;
  actual_hours: number;
  days_elapsed: number;
  projected_hours: number;
  status: 'no_target' | 'on_track' | 'at_risk' | 'unlikely';
}

export interface TargetRecommendation {
  area: Area;
  current_target: number;
  suggested_target: number;
  avg_actual: number;
  reason: 'consistent_over' | 'consistent_under';
  message: string;
}

export interface TimeBudget {
  total_available: number;
  total_allocated: number;
  unallocated: number;
  allocation_percentage: number;
}
