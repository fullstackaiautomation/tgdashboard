-- Story 5.3: Business Area Summary Function (Simplified)
-- Aggregate metrics across all business areas

CREATE OR REPLACE FUNCTION get_business_area_summary(p_user_id UUID)
RETURNS TABLE (
  total_tasks INTEGER,
  completed_tasks INTEGER,
  active_tasks INTEGER,
  overall_completion_percentage NUMERIC,
  hours_this_week NUMERIC,
  overdue_tasks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_tasks,
    COUNT(*) FILTER (WHERE progress_percentage = 100)::INTEGER AS completed_tasks,
    COUNT(*) FILTER (WHERE progress_percentage < 100)::INTEGER AS active_tasks,
    COALESCE(ROUND(AVG(progress_percentage), 2), 0) AS overall_completion_percentage,
    COALESCE(
      (SELECT ROUND(SUM(dwl.duration_minutes) / 60.0, 2)
       FROM deep_work_log dwl
       WHERE dwl.user_id = p_user_id
         AND dwl.area IN ('Full Stack', 'S4', '808', 'Huge Capital')
         AND dwl.start_time >= NOW() - INTERVAL '7 days'
         AND dwl.end_time IS NOT NULL),
      0
    ) AS hours_this_week,
    COUNT(*) FILTER (WHERE due_date < NOW() AND progress_percentage < 100)::INTEGER AS overdue_tasks
  FROM tasks
  WHERE user_id = p_user_id
    AND area IN ('Full Stack', 'S4', '808', 'Huge Capital');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_business_area_summary(UUID) TO authenticated;
