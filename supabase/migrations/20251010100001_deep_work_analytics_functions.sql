-- Calculate Deep Work streak (consecutive days with at least one session)
CREATE OR REPLACE FUNCTION calculate_deep_work_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_session_count INTEGER;
BEGIN
  LOOP
    SELECT COUNT(*)
    INTO v_session_count
    FROM deep_work_sessions
    WHERE user_id = p_user_id
      AND DATE(start_time) = v_check_date
      AND status = 'completed';

    IF v_session_count > 0 THEN
      v_current_streak := v_current_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    -- Safety limit: check max 365 days
    IF v_current_streak >= 365 THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get comprehensive session analytics
CREATE OR REPLACE FUNCTION get_session_analytics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'completed_sessions', COUNT(*) FILTER (WHERE status = 'completed'),
    'avg_session_length_minutes', ROUND(AVG(duration_minutes), 0),
    'median_session_length_minutes', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_minutes), 0),
    'longest_session_minutes', MAX(duration_minutes),
    'shortest_session_minutes', MIN(duration_minutes),
    'total_deep_work_hours', ROUND(SUM(duration_minutes) / 60.0, 2),
    'avg_sessions_per_day', ROUND(COUNT(*)::NUMERIC / NULLIF(EXTRACT(DAY FROM p_end_date - p_start_date) + 1, 0), 1),
    'session_length_distribution', jsonb_build_object(
      'under_30min', COUNT(*) FILTER (WHERE duration_minutes < 30),
      '30_to_60min', COUNT(*) FILTER (WHERE duration_minutes >= 30 AND duration_minutes < 60),
      '60_to_90min', COUNT(*) FILTER (WHERE duration_minutes >= 60 AND duration_minutes < 90),
      '90_to_120min', COUNT(*) FILTER (WHERE duration_minutes >= 90 AND duration_minutes < 120),
      'over_120min', COUNT(*) FILTER (WHERE duration_minutes >= 120)
    )
  ) INTO v_result
  FROM deep_work_sessions
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND status = 'completed';

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate focus quality score (planned vs reactive work)
CREATE OR REPLACE FUNCTION calculate_focus_quality_score(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
  SELECT
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE is_planned = TRUE)::NUMERIC / COUNT(*)) * 100, 0)
    END
  FROM deep_work_sessions
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND status = 'completed';
$$ LANGUAGE SQL STABLE;

-- Calculate completion rate (goal achievement)
CREATE OR REPLACE FUNCTION calculate_completion_rate(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
  SELECT
    CASE
      WHEN COUNT(*) FILTER (WHERE goal_achieved IS NOT NULL) = 0 THEN NULL
      ELSE ROUND((COUNT(*) FILTER (WHERE goal_achieved = TRUE)::NUMERIC /
        COUNT(*) FILTER (WHERE goal_achieved IS NOT NULL)) * 100, 0)
    END
  FROM deep_work_sessions
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND status = 'completed';
$$ LANGUAGE SQL STABLE;

-- Analyze interruptions
CREATE OR REPLACE FUNCTION analyze_interruptions(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'interrupted_sessions', COUNT(*) FILTER (WHERE was_interrupted = TRUE),
    'interruption_rate', ROUND((COUNT(*) FILTER (WHERE was_interrupted = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 0),
    'reasons', COALESCE((
      SELECT jsonb_object_agg(interruption_reason, reason_count)
      FROM (
        SELECT interruption_reason, COUNT(*) as reason_count
        FROM deep_work_sessions
        WHERE user_id = p_user_id
          AND DATE(start_time) >= p_start_date
          AND DATE(start_time) <= p_end_date
          AND was_interrupted = TRUE
          AND interruption_reason IS NOT NULL
        GROUP BY interruption_reason
        ORDER BY reason_count DESC
      ) reasons
    ), '{}'::jsonb)
  )
  FROM deep_work_sessions
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND status = 'completed';
$$ LANGUAGE SQL STABLE;

-- Calculate context switches per day
CREATE OR REPLACE FUNCTION calculate_context_switches(
  p_user_id UUID,
  p_date DATE
)
RETURNS INTEGER AS $$
  SELECT GREATEST(COUNT(DISTINCT COALESCE(business_id::TEXT, life_area_id::TEXT, 'none')) - 1, 0)
  FROM deep_work_sessions
  WHERE user_id = p_user_id
    AND DATE(start_time) = p_date
    AND status = 'completed';
$$ LANGUAGE SQL STABLE;

-- Get daily time allocation by business/life area
CREATE OR REPLACE FUNCTION get_daily_time_allocation(
  p_user_id UUID,
  p_date DATE
)
RETURNS JSONB AS $$
  SELECT COALESCE(
    jsonb_object_agg(
      area_name,
      hours
    ),
    '{}'::jsonb
  )
  FROM (
    SELECT
      COALESCE(b.name, la.name, 'Unallocated') as area_name,
      ROUND(SUM(dws.duration_minutes) / 60.0, 2) as hours
    FROM deep_work_sessions dws
    LEFT JOIN businesses b ON dws.business_id = b.id
    LEFT JOIN life_areas la ON dws.life_area_id = la.id
    WHERE dws.user_id = p_user_id
      AND DATE(dws.start_time) = p_date
      AND dws.status = 'completed'
    GROUP BY COALESCE(b.name, la.name, 'Unallocated')
  ) allocation;
$$ LANGUAGE SQL STABLE;
