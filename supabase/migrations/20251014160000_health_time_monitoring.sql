-- Migration: Health Time Monitoring
-- Story 4.3: Health goal time allocation monitoring functions

-- Function to get comprehensive health time statistics
-- Uses simple deep_work_log table with area = 'Health'
CREATE OR REPLACE FUNCTION get_health_time_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_target_weekly INTEGER;
  v_target_daily NUMERIC;
  v_hours_today NUMERIC;
  v_hours_this_week NUMERIC;
  v_hours_last_week NUMERIC;
BEGIN
  -- Get time targets from area_time_budgets
  SELECT target_hours_per_week
  INTO v_target_weekly
  FROM area_time_budgets
  WHERE user_id = p_user_id AND area = 'Health';

  -- Calculate daily target (weekly / 7)
  v_target_daily := CASE WHEN v_target_weekly IS NOT NULL THEN v_target_weekly / 7.0 ELSE 0.75 END;

  -- Calculate hours today
  SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
  INTO v_hours_today
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND area = 'Health'
    AND DATE(start_time) = CURRENT_DATE
    AND end_time IS NOT NULL;

  -- Calculate hours this week (last 7 days)
  SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
  INTO v_hours_this_week
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND area = 'Health'
    AND start_time >= NOW() - INTERVAL '7 days'
    AND end_time IS NOT NULL;

  -- Calculate hours last week (7-14 days ago)
  SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
  INTO v_hours_last_week
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND area = 'Health'
    AND start_time >= NOW() - INTERVAL '14 days'
    AND start_time < NOW() - INTERVAL '7 days'
    AND end_time IS NOT NULL;

  -- Use default target of 5h if no budget set
  IF v_target_weekly IS NULL THEN
    v_target_weekly := 5;
  END IF;

  RETURN jsonb_build_object(
    'hours_today', ROUND(v_hours_today, 2),
    'hours_this_week', ROUND(v_hours_this_week, 2),
    'hours_last_week', ROUND(v_hours_last_week, 2),
    'target_daily_hours', ROUND(v_target_daily, 2),
    'target_weekly_hours', v_target_weekly,
    'daily_percentage', CASE
      WHEN v_target_daily > 0 THEN ROUND((v_hours_today / v_target_daily) * 100, 0)
      ELSE 0
    END,
    'weekly_percentage', CASE
      WHEN v_target_weekly > 0 THEN ROUND((v_hours_this_week / v_target_weekly) * 100, 0)
      ELSE 0
    END,
    'weekly_delta', ROUND(v_hours_this_week - v_hours_last_week, 2),
    'weekly_delta_percentage', CASE
      WHEN v_hours_last_week > 0 THEN ROUND(((v_hours_this_week - v_hours_last_week) / v_hours_last_week) * 100, 0)
      ELSE 0
    END,
    'hours_below_target', CASE
      WHEN v_hours_this_week < v_target_weekly THEN ROUND(v_target_weekly - v_hours_this_week, 2)
      ELSE 0
    END
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate health time streak (consecutive weeks meeting target)
CREATE OR REPLACE FUNCTION calculate_health_time_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_target_weekly INTEGER;
  v_current_streak INTEGER := 0;
  v_week_offset INTEGER := 0;
  v_week_hours NUMERIC;
BEGIN
  -- Get weekly target
  SELECT target_hours_per_week
  INTO v_target_weekly
  FROM area_time_budgets
  WHERE user_id = p_user_id AND area = 'Health';

  -- Use default of 5h if no budget set
  IF v_target_weekly IS NULL THEN
    v_target_weekly := 5;
  END IF;

  -- Iterate through weeks starting from current week
  LOOP
    SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
    INTO v_week_hours
    FROM deep_work_log
    WHERE user_id = p_user_id
      AND area = 'Health'
      AND start_time >= NOW() - ((v_week_offset + 1) * 7 || ' days')::INTERVAL
      AND start_time < NOW() - (v_week_offset * 7 || ' days')::INTERVAL
      AND end_time IS NOT NULL;

    -- If week meets target, increment streak
    IF v_week_hours >= v_target_weekly THEN
      v_current_streak := v_current_streak + 1;
      v_week_offset := v_week_offset + 1;
    ELSE
      -- Streak broken
      EXIT;
    END IF;

    -- Safety limit: check max 52 weeks
    IF v_week_offset >= 52 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- Detect health neglect risk (2+ consecutive weeks below 50% target)
CREATE OR REPLACE FUNCTION detect_health_neglect_risk(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_target_weekly INTEGER;
  v_weeks_below_50 INTEGER := 0;
  v_consecutive_below INTEGER := 0;
  v_week_offset INTEGER;
  v_week_hours NUMERIC;
  v_risk_level TEXT;
BEGIN
  -- Get weekly target
  SELECT target_hours_per_week
  INTO v_target_weekly
  FROM area_time_budgets
  WHERE user_id = p_user_id AND area = 'Health';

  -- Use default of 5h if no budget set
  IF v_target_weekly IS NULL THEN
    v_target_weekly := 5;
  END IF;

  -- Check last 4 weeks
  FOR v_week_offset IN 0..3 LOOP
    SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
    INTO v_week_hours
    FROM deep_work_log
    WHERE user_id = p_user_id
      AND area = 'Health'
      AND start_time >= NOW() - ((v_week_offset + 1) * 7 || ' days')::INTERVAL
      AND start_time < NOW() - (v_week_offset * 7 || ' days')::INTERVAL
      AND end_time IS NOT NULL;

    -- Check if below 50% of target
    IF v_week_hours < (v_target_weekly * 0.5) THEN
      v_weeks_below_50 := v_weeks_below_50 + 1;
      -- Track consecutive weeks (only for most recent weeks)
      IF v_week_offset = 0 OR v_consecutive_below > 0 THEN
        v_consecutive_below := v_consecutive_below + 1;
      END IF;
    ELSE
      -- Reset consecutive counter if this week is OK
      IF v_week_offset = 0 THEN
        v_consecutive_below := 0;
      END IF;
    END IF;
  END LOOP;

  -- Determine risk level based on consecutive weeks below threshold
  IF v_consecutive_below = 0 THEN
    v_risk_level := 'none';
  ELSIF v_consecutive_below = 1 THEN
    v_risk_level := 'low';
  ELSE
    v_risk_level := 'high';
  END IF;

  RETURN jsonb_build_object(
    'risk_level', v_risk_level,
    'weeks_below_50', v_weeks_below_50,
    'consecutive_below', v_consecutive_below,
    'target_weekly', v_target_weekly,
    'threshold', v_target_weekly * 0.5
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get health activity breakdown by labels
CREATE OR REPLACE FUNCTION get_health_activity_breakdown(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  activity TEXT,
  hours NUMERIC,
  session_count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH health_sessions AS (
    SELECT
      UNNEST(labels) as activity,
      duration_minutes
    FROM deep_work_log
    WHERE user_id = p_user_id
      AND area = 'Health'
      AND labels IS NOT NULL
      AND start_time >= NOW() - (p_days || ' days')::INTERVAL
      AND end_time IS NOT NULL
  ),
  activity_totals AS (
    SELECT
      activity,
      ROUND(SUM(duration_minutes) / 60.0, 2) as hours,
      COUNT(*) as session_count
    FROM health_sessions
    GROUP BY activity
  ),
  total_hours AS (
    SELECT SUM(hours) as total FROM activity_totals
  )
  SELECT
    at.activity,
    at.hours,
    at.session_count,
    CASE
      WHEN th.total > 0 THEN ROUND((at.hours / th.total) * 100, 1)
      ELSE 0
    END as percentage
  FROM activity_totals at
  CROSS JOIN total_hours th
  ORDER BY at.hours DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get weekly health summary for last N weeks
CREATE OR REPLACE FUNCTION get_weekly_health_summary(
  p_user_id UUID,
  p_weeks INTEGER DEFAULT 4
)
RETURNS TABLE (
  week_start DATE,
  week_number INTEGER,
  hours NUMERIC,
  target_hours INTEGER,
  met_target BOOLEAN,
  percentage INTEGER
) AS $$
DECLARE
  v_target_weekly INTEGER;
BEGIN
  -- Get weekly target
  SELECT target_hours_per_week
  INTO v_target_weekly
  FROM area_time_budgets
  WHERE user_id = p_user_id AND area = 'Health';

  -- Use default of 5h if no budget set
  IF v_target_weekly IS NULL THEN
    v_target_weekly := 5;
  END IF;

  RETURN QUERY
  WITH week_series AS (
    SELECT
      generate_series(0, p_weeks - 1) as week_offset
  ),
  weekly_hours AS (
    SELECT
      ws.week_offset,
      (NOW() - ((ws.week_offset + 1) * 7 || ' days')::INTERVAL)::DATE as week_start,
      COALESCE(SUM(dwl.duration_minutes) / 60.0, 0) as hours
    FROM week_series ws
    LEFT JOIN deep_work_log dwl ON
      dwl.user_id = p_user_id
      AND dwl.area = 'Health'
      AND dwl.start_time >= NOW() - ((ws.week_offset + 1) * 7 || ' days')::INTERVAL
      AND dwl.start_time < NOW() - (ws.week_offset * 7 || ' days')::INTERVAL
      AND dwl.end_time IS NOT NULL
    GROUP BY ws.week_offset
  )
  SELECT
    wh.week_start,
    (p_weeks - wh.week_offset) as week_number,
    ROUND(wh.hours, 2) as hours,
    v_target_weekly as target_hours,
    (wh.hours >= v_target_weekly) as met_target,
    CASE
      WHEN v_target_weekly > 0 THEN ROUND((wh.hours / v_target_weekly) * 100, 0)::INTEGER
      ELSE 0
    END as percentage
  FROM weekly_hours wh
  ORDER BY wh.week_offset ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_health_time_stats(UUID) IS 'Get comprehensive health time statistics using simple deep_work_log table';
COMMENT ON FUNCTION calculate_health_time_streak(UUID) IS 'Calculate consecutive weeks meeting health time target';
COMMENT ON FUNCTION detect_health_neglect_risk(UUID) IS 'Detect if health time has fallen below 50% target for 2+ consecutive weeks';
COMMENT ON FUNCTION get_health_activity_breakdown(UUID, INTEGER) IS 'Get health activity breakdown by labels for specified days';
COMMENT ON FUNCTION get_weekly_health_summary(UUID, INTEGER) IS 'Get weekly health time summary for last N weeks';
