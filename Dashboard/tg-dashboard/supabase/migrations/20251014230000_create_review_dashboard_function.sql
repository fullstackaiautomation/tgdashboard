-- Story 5.1: Review Dashboard - Aggregation Function
-- Creates optimized single-query function to aggregate all 7 areas for Review Dashboard

-- Main aggregation function
CREATE OR REPLACE FUNCTION get_review_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
  area TEXT,
  total_tasks INTEGER,
  completed_tasks INTEGER,
  active_tasks INTEGER,
  overdue_tasks INTEGER,
  progress_percentage NUMERIC,
  last_updated TIMESTAMPTZ,
  hours_this_week NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.area::TEXT,
    COUNT(t.id)::INTEGER as total_tasks,
    COUNT(t.id) FILTER (WHERE t.progress_percentage = 100)::INTEGER as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.progress_percentage < 100)::INTEGER as active_tasks,
    COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.progress_percentage < 100)::INTEGER as overdue_tasks,
    ROUND(AVG(t.progress_percentage), 2) as progress_percentage,
    MAX(t.updated_at) as last_updated,
    COALESCE(
      (SELECT ROUND(SUM(dwl.duration_minutes) / 60.0, 2)
       FROM deep_work_log dwl
       WHERE dwl.area = t.area
         AND dwl.start_time >= NOW() - INTERVAL '7 days'
         AND dwl.end_time IS NOT NULL
         AND dwl.user_id = p_user_id),
      0
    ) as hours_this_week
  FROM tasks t
  WHERE t.user_id = p_user_id
    AND t.area IN ('Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health')
  GROUP BY t.area;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance optimization indexes for review queries
CREATE INDEX IF NOT EXISTS idx_tasks_review_aggregation
  ON tasks(user_id, area, progress_percentage, due_date, updated_at);

-- Index for weekly aggregation (without NOW() in WHERE clause as it's not immutable)
CREATE INDEX IF NOT EXISTS idx_deep_work_log_weekly_aggregation
  ON deep_work_log(user_id, area, start_time, end_time);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_review_dashboard_summary(UUID) TO authenticated;
