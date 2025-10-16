-- Migration: Add task status to get_daily_schedule function
-- Purpose: Include task.status so we can visually indicate completed tasks in the schedule

-- Drop existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_daily_schedule(UUID, DATE);

-- Recreate with new task_status column
CREATE OR REPLACE FUNCTION get_daily_schedule(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  block_id UUID,
  task_id UUID,
  task_name TEXT,
  area TEXT,
  start_time TIME,
  end_time TIME,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status TEXT,
  notes TEXT,
  task_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.id AS block_id,
    ttb.task_id,
    t.task_name,
    t.area,
    ttb.start_time,
    ttb.end_time,
    ttb.planned_duration_minutes,
    ttb.actual_duration_minutes,
    ttb.status,
    ttb.notes,
    t.status AS task_status
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date = p_date
  ORDER BY ttb.start_time;
END;
$$ LANGUAGE plpgsql;
