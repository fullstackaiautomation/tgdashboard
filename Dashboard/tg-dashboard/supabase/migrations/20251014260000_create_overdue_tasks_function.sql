-- Story 5.6: Intelligence & Alerts - Minimal Implementation
-- Function to retrieve overdue tasks across all areas

CREATE OR REPLACE FUNCTION get_overdue_tasks(p_user_id UUID)
RETURNS TABLE (
  task_id UUID,
  task_name TEXT,
  area TEXT,
  due_date TIMESTAMPTZ,
  days_overdue INTEGER,
  priority TEXT,
  phase_name TEXT,
  project_name TEXT,
  business_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS task_id,
    t.name AS task_name,
    t.area,
    t.due_date,
    EXTRACT(DAY FROM NOW() - t.due_date)::INTEGER AS days_overdue,
    t.priority,
    p.name AS phase_name,
    pr.name AS project_name,
    b.name AS business_name
  FROM tasks t
  LEFT JOIN phases p ON t.phase_id = p.id
  LEFT JOIN projects pr ON p.project_id = pr.id
  LEFT JOIN businesses b ON pr.business_id = b.id
  WHERE t.user_id = p_user_id
    AND t.status != 'done'
    AND t.due_date < NOW()
  ORDER BY t.due_date ASC, t.priority DESC
  LIMIT 20;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_overdue_tasks(UUID) TO authenticated;
