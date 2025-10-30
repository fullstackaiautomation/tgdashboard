-- Improve get_unscheduled_tasks:
-- 1. Exclude completed tasks
-- 2. Order by due date first
-- 3. Show only tasks not yet scheduled

DROP FUNCTION IF EXISTS get_unscheduled_tasks(UUID);

CREATE OR REPLACE FUNCTION get_unscheduled_tasks(
  p_user_id UUID,
  p_area TEXT DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  task_name TEXT,
  area TEXT,
  priority TEXT,
  hours_projected DECIMAL,
  hours_worked DECIMAL,
  hours_remaining DECIMAL,
  due_date TIMESTAMPTZ,
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
    AND t.status NOT IN ('completed', 'cancelled')  -- Exclude completed and cancelled
    AND (p_area IS NULL OR t.area = p_area)  -- Optional area filter
  ORDER BY
    t.due_date NULLS LAST,  -- Due date first (upcoming tasks first)
    CASE t.priority
      WHEN 'High' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Low' THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
