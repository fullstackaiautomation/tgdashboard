-- Fix weekly calendar summary to calculate actual hours from start/end times
-- instead of using potentially stale planned_duration_minutes

CREATE OR REPLACE FUNCTION get_weekly_calendar_summary(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  scheduled_date DATE,
  total_blocks INTEGER,
  total_planned_minutes INTEGER,
  total_actual_minutes INTEGER,
  areas_scheduled TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.scheduled_date,
    COUNT(*)::INTEGER AS total_blocks,
    -- Calculate actual duration from start_time to end_time
    SUM(
      EXTRACT(EPOCH FROM (ttb.end_time::time - ttb.start_time::time)) / 60
    )::INTEGER AS total_planned_minutes,
    SUM(COALESCE(ttb.actual_duration_minutes, 0))::INTEGER AS total_actual_minutes,
    ARRAY_AGG(DISTINCT t.area) AS areas_scheduled
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date >= p_week_start
    AND ttb.scheduled_date < p_week_start + INTERVAL '7 days'
  GROUP BY ttb.scheduled_date
  ORDER BY ttb.scheduled_date;
END;
$$ LANGUAGE plpgsql;
