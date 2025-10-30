-- Fix get_unscheduled_tasks to show ALL active tasks, not just those without time blocks
-- This allows users to see all their tasks and schedule them to the calendar

DROP FUNCTION IF EXISTS get_unscheduled_tasks(UUID);

CREATE OR REPLACE FUNCTION get_unscheduled_tasks(
  p_user_id UUID
)
RETURNS TABLE (
  task_id UUID,
  task_name TEXT,
  area TEXT,
  priority TEXT,
  hours_projected DECIMAL,
  hours_worked DECIMAL,
  hours_remaining DECIMAL,
  due_date DATE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS task_id,
    t.task_name,
    t.area,
    t.priority,
    t.hours_projected,
    COALESCE(t.hours_worked, 0) AS hours_worked,
    (COALESCE(t.hours_projected, 0) - COALESCE(t.hours_worked, 0)) AS hours_remaining,
    t.due_date,
    t.status
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.status IN ('active', 'in_progress')
    -- Show all active tasks, even if they don't have hours_projected
    -- Users can still schedule them to time blocks
  ORDER BY
    CASE t.priority
      WHEN 'High' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Low' THEN 3
      ELSE 4
    END,
    t.due_date NULLS LAST,
    t.created_at DESC;
END;
$$ LANGUAGE plpgsql;
