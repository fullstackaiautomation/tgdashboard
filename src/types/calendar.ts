/**
 * Calendar and Task Scheduling Types
 *
 * Types for the master calendar system that allows scheduling
 * specific tasks to calendar time blocks
 */

import type { Area, Priority, EffortLevel, TaskStatus } from './task';

export type TimeBlockStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskTimeBlock {
  id: string;
  user_id: string;
  task_id: string;

  // Scheduling
  scheduled_date: string; // ISO date string (YYYY-MM-DD)
  start_time: string; // Time string (HH:MM:SS)
  end_time: string; // Time string (HH:MM:SS)

  // Duration
  planned_duration_minutes: number;
  actual_duration_minutes: number | null;

  // Status
  status: TimeBlockStatus;

  // Notes
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CalendarViewBlock {
  block_id: string;
  task_id: string;
  task_name: string;
  area: Area;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  planned_duration_minutes: number;
  actual_duration_minutes: number | null;
  status: TimeBlockStatus;
  notes: string | null;
  task_status: TaskStatus;
  task_priority: Priority;
  task_effort_level: EffortLevel;
  hours_projected: number | null;
  hours_worked: number | null;
}

export interface DailyScheduleBlock {
  block_id: string;
  task_id: string;
  task_name: string;
  area: Area;
  start_time: string;
  end_time: string;
  planned_duration_minutes: number;
  actual_duration_minutes: number | null;
  status: TimeBlockStatus;
  notes: string | null;
}

export interface WeeklyCalendarSummary {
  scheduled_date: string;
  total_blocks: number;
  total_planned_minutes: number;
  total_actual_minutes: number;
  areas_scheduled: Area[];
}

export interface UnscheduledTask {
  task_id: string;
  task_name: string;
  area: Area;
  priority: Priority;
  hours_projected: number;
  hours_worked: number;
  hours_remaining: number;
  due_date: string | null;
  status: TaskStatus;
}

export interface TimeBlockConflict {
  block_id: string;
  task_name: string;
  start_time: string;
  end_time: string;
}

export interface TaskSchedulingAnalytics {
  area: Area;
  total_blocks: number;
  total_planned_hours: number;
  total_actual_hours: number;
  completion_rate: number;
  avg_accuracy: number; // Percentage of how accurate time estimates were
}

// Calendar view modes
export type CalendarViewMode = 'day' | 'week' | 'month';

// Time slot for scheduling
export interface TimeSlot {
  date: string; // ISO date
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
}

// Calendar event (for display in calendar grid)
export interface CalendarEvent {
  id: string;
  title: string;
  area: Area;
  startDateTime: Date;
  endDateTime: Date;
  durationMinutes: number;
  status: TimeBlockStatus;
  taskId: string;
  taskPriority: Priority;
  notes: string | null;
}

// Day cell data for calendar grid
export interface CalendarDayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  totalPlannedMinutes: number;
  totalActualMinutes: number;
}

// Week row data for weekly view
export interface CalendarWeekData {
  weekNumber: number;
  days: CalendarDayData[];
}
