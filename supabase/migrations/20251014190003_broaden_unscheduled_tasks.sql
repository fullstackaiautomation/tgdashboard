-- Broaden get_unscheduled_tasks to show all non-completed tasks
-- Not just 'active' and 'in_progress'

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
    AND t.status != 'completed'  -- Show all non-completed tasks
  ORDER BY
    CASE t.priority
      WHEN 'High' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Low' THEN 3
      ELSE 4
    END,
    t.due_date NULLS LAST,
    t.created_at DESC
  LIMIT 100;  -- Limit to 100 tasks to keep it performant
END;
$$ LANGUAGE plpgsql;
