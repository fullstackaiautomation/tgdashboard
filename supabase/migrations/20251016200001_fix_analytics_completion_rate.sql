-- Fix task scheduling analytics to calculate completion based on task status, not time block status

CREATE OR REPLACE FUNCTION get_task_scheduling_analytics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  area TEXT,
  total_blocks INTEGER,
  total_planned_hours DECIMAL,
  total_actual_hours DECIMAL,
  completion_rate DECIMAL,
  avg_accuracy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.area,
    COUNT(*)::INTEGER AS total_blocks,
    -- Calculate hours from actual start/end times
    ROUND(
      SUM(EXTRACT(EPOCH FROM (ttb.end_time::time - ttb.start_time::time)) / 3600)::DECIMAL,
      2
    ) AS total_planned_hours,
    ROUND(SUM(COALESCE(ttb.actual_duration_minutes, 0))::DECIMAL / 60, 2) AS total_actual_hours,
    -- Completion rate based on TASK status, not time block status
    ROUND(
      (COUNT(*) FILTER (WHERE t.status = 'Done')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      0
    ) AS completion_rate,
    -- Average accuracy for completed blocks
    ROUND(
      AVG(
        CASE
          WHEN ttb.actual_duration_minutes IS NOT NULL AND ttb.actual_duration_minutes > 0
          THEN (ttb.actual_duration_minutes::DECIMAL / ttb.planned_duration_minutes) * 100
          ELSE NULL
        END
      ),
      1
    ) AS avg_accuracy
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date BETWEEN p_start_date AND p_end_date
  GROUP BY t.area
  ORDER BY total_planned_hours DESC;
END;
$$ LANGUAGE plpgsql;
