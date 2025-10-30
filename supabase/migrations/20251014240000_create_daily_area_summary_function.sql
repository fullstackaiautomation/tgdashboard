-- Story 5.2: Daily Area Summary Function
-- Comprehensive aggregation for Daily area card with all metrics

CREATE OR REPLACE FUNCTION get_daily_area_summary(p_user_id UUID)
RETURNS TABLE (
  -- Task metrics
  tasks_due_today INTEGER,
  tasks_completed_today INTEGER,
  tasks_overdue INTEGER,
  tasks_due_tomorrow INTEGER,
  daily_completion_percentage NUMERIC,

  -- Deep Work metrics
  deep_work_hours_today NUMERIC,
  deep_work_target_hours NUMERIC,

  -- Last session info
  last_session_area TEXT,
  last_session_duration NUMERIC,
  last_session_start TIMESTAMPTZ,

  -- Next scheduled item
  next_scheduled_task TEXT,
  next_scheduled_time TIME,
  next_scheduled_area TEXT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
BEGIN
  RETURN QUERY
  WITH task_metrics AS (
    SELECT
      COUNT(*) FILTER (WHERE due_date = v_today)::INTEGER AS tasks_due_today,
      COUNT(*) FILTER (WHERE due_date = v_today AND progress_percentage = 100)::INTEGER AS tasks_completed_today,
      COUNT(*) FILTER (WHERE due_date < v_today AND progress_percentage < 100)::INTEGER AS tasks_overdue,
      COUNT(*) FILTER (WHERE due_date = v_today + 1)::INTEGER AS tasks_due_tomorrow
    FROM tasks
    WHERE user_id = p_user_id
      AND area = 'Personal' -- Personal maps to Daily area
  ),
  deep_work_metrics AS (
    SELECT
      COALESCE(ROUND(SUM(duration_minutes) / 60.0, 2), 0) AS hours_today
    FROM deep_work_log
    WHERE user_id = p_user_id
      AND area = 'Personal'
      AND DATE(start_time) = v_today
      AND end_time IS NOT NULL
  ),
  last_session AS (
    SELECT
      area,
      ROUND(duration_minutes / 60.0, 2) AS duration_hours,
      start_time
    FROM deep_work_log
    WHERE user_id = p_user_id
      AND DATE(start_time) = v_today
      AND end_time IS NOT NULL
    ORDER BY start_time DESC
    LIMIT 1
  ),
  next_scheduled AS (
    SELECT
      t.task_name,
      ttb.start_time,
      t.area
    FROM task_time_blocks ttb
    JOIN tasks t ON ttb.task_id = t.id
    WHERE ttb.user_id = p_user_id
      AND ttb.scheduled_date = v_today
      AND ttb.start_time > CURRENT_TIME
      AND ttb.status IN ('scheduled', 'in_progress')
    ORDER BY ttb.start_time
    LIMIT 1
  )
  SELECT
    tm.tasks_due_today,
    tm.tasks_completed_today,
    tm.tasks_overdue,
    tm.tasks_due_tomorrow,
    CASE
      WHEN tm.tasks_due_today > 0 THEN ROUND((tm.tasks_completed_today::NUMERIC / tm.tasks_due_today) * 100, 2)
      ELSE 0
    END AS daily_completion_percentage,
    dwm.hours_today AS deep_work_hours_today,
    6.0 AS deep_work_target_hours, -- Default 6h target
    ls.area AS last_session_area,
    ls.duration_hours AS last_session_duration,
    ls.start_time AS last_session_start,
    ns.task_name AS next_scheduled_task,
    ns.start_time AS next_scheduled_time,
    ns.area AS next_scheduled_area
  FROM task_metrics tm
  CROSS JOIN deep_work_metrics dwm
  LEFT JOIN last_session ls ON TRUE
  LEFT JOIN next_scheduled ns ON TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_daily_area_summary(UUID) TO authenticated;
