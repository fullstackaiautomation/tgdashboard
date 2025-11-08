-- Migration: Add hours_projected and hours_worked to calendar view
-- Purpose: Enable tracking of actual vs projected time for time estimation analytics

-- Drop existing function first (can't change return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS get_calendar_view(UUID, DATE, DATE);

-- Recreate get_calendar_view function with hours tracking
CREATE FUNCTION get_calendar_view(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  block_id UUID,
  task_id UUID,
  task_name TEXT,
  area TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status TEXT,
  notes TEXT,
  task_status TEXT,
  task_priority TEXT,
  task_effort_level TEXT,
  hours_projected DECIMAL,
  hours_worked DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.id AS block_id,
    ttb.task_id,
    t.task_name,
    t.area,
    ttb.scheduled_date,
    ttb.start_time,
    ttb.end_time,
    ttb.planned_duration_minutes,
    ttb.actual_duration_minutes,
    ttb.status,
    ttb.notes,
    t.status AS task_status,
    t.priority AS task_priority,
    t.effort_level AS task_effort_level,
    t.hours_projected,
    t.hours_worked
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date BETWEEN p_start_date AND p_end_date
  ORDER BY ttb.scheduled_date, ttb.start_time;
END;
$$ LANGUAGE plpgsql;
