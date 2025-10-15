-- Migration: Time Analytics SQL Functions for Story 4.4
-- Creates database functions for the Time Allocation Visual Analytics Dashboard

-- ============================================================================
-- 1. Weekly Heatmap Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_weekly_heatmap(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE(
  day_date DATE,
  area TEXT,
  hours NUMERIC
) AS $$
  SELECT
    DATE(dwl.start_time) as day_date,
    dwl.area,
    ROUND(SUM(dwl.duration_minutes) / 60.0, 2) as hours
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_week_start
    AND DATE(dwl.start_time) < p_week_start + INTERVAL '7 days'
    AND dwl.end_time IS NOT NULL
    AND dwl.area IS NOT NULL
  GROUP BY DATE(dwl.start_time), dwl.area
  ORDER BY day_date, area;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 2. Area Distribution Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_area_distribution(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  area TEXT,
  hours NUMERIC,
  percentage NUMERIC
) AS $$
WITH area_hours AS (
  SELECT
    dwl.area,
    SUM(dwl.duration_minutes) / 60.0 as hours
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_start_date
    AND DATE(dwl.start_time) <= p_end_date
    AND dwl.end_time IS NOT NULL
    AND dwl.area IS NOT NULL
  GROUP BY dwl.area
),
total_hours AS (
  SELECT COALESCE(SUM(hours), 0) as total FROM area_hours
)
SELECT
  ah.area,
  ROUND(ah.hours, 2) as hours,
  CASE
    WHEN th.total > 0 THEN ROUND((ah.hours / th.total) * 100, 1)
    ELSE 0
  END as percentage
FROM area_hours ah, total_hours th
ORDER BY hours DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 3. Task Type Distribution Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_task_type_distribution(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  task_type TEXT,
  hours NUMERIC,
  percentage NUMERIC,
  session_count INTEGER
) AS $$
WITH type_hours AS (
  SELECT
    dwl.task_type,
    SUM(dwl.duration_minutes) / 60.0 as hours,
    COUNT(*)::INTEGER as session_count
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_start_date
    AND DATE(dwl.start_time) <= p_end_date
    AND dwl.end_time IS NOT NULL
    AND dwl.task_type IS NOT NULL
  GROUP BY dwl.task_type
),
total_hours AS (
  SELECT COALESCE(SUM(hours), 0) as total FROM type_hours
)
SELECT
  th.task_type,
  ROUND(th.hours, 2) as hours,
  CASE
    WHEN tot.total > 0 THEN ROUND((th.hours / tot.total) * 100, 1)
    ELSE 0
  END as percentage,
  th.session_count
FROM type_hours th, total_hours tot
ORDER BY hours DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 4. Time Allocation Trend Function (3 months)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_time_allocation_trend(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  date DATE,
  area TEXT,
  hours NUMERIC
) AS $$
  SELECT
    DATE(dwl.start_time) as date,
    dwl.area,
    ROUND(SUM(dwl.duration_minutes) / 60.0, 2) as hours
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_start_date
    AND DATE(dwl.start_time) <= p_end_date
    AND dwl.end_time IS NOT NULL
    AND dwl.area IS NOT NULL
  GROUP BY DATE(dwl.start_time), dwl.area
  ORDER BY date, area;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 5. Focus Time Metric Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_focus_time_metric(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_hours_per_day NUMERIC DEFAULT 8,
  p_work_days_per_week INTEGER DEFAULT 5
)
RETURNS TABLE(
  tracked_hours NUMERIC,
  available_hours NUMERIC,
  focus_percentage NUMERIC
) AS $$
WITH tracked AS (
  SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) as hours
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND end_time IS NOT NULL
),
available AS (
  SELECT
    -- Count weekdays in range
    COUNT(CASE
      WHEN EXTRACT(DOW FROM d::date) BETWEEN 1 AND 5 THEN 1
    END) * p_hours_per_day as hours
  FROM generate_series(p_start_date::timestamp, p_end_date::timestamp, '1 day'::interval) d
)
SELECT
  ROUND(t.hours, 2) as tracked_hours,
  a.hours as available_hours,
  CASE
    WHEN a.hours > 0 THEN ROUND((t.hours / a.hours) * 100, 1)
    ELSE 0
  END as focus_percentage
FROM tracked t, available a;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 6. Peak Productivity (Hour of Day) Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_peak_productivity(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  hour_of_day INTEGER,
  session_count INTEGER,
  total_hours NUMERIC
) AS $$
  SELECT
    EXTRACT(HOUR FROM start_time)::INTEGER as hour_of_day,
    COUNT(*)::INTEGER as session_count,
    ROUND(SUM(duration_minutes) / 60.0, 2) as total_hours
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND end_time IS NOT NULL
  GROUP BY EXTRACT(HOUR FROM start_time)
  ORDER BY hour_of_day;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 7. Label Time Analysis Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_label_analysis(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  label TEXT,
  session_count INTEGER,
  total_hours NUMERIC,
  percentage NUMERIC
) AS $$
WITH label_hours AS (
  SELECT
    UNNEST(labels) as label,
    COUNT(*)::INTEGER as session_count,
    SUM(duration_minutes) / 60.0 as total_hours
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND end_time IS NOT NULL
    AND labels IS NOT NULL
    AND array_length(labels, 1) > 0
  GROUP BY label
),
total_hours AS (
  SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) as total
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND end_time IS NOT NULL
)
SELECT
  lh.label,
  lh.session_count,
  ROUND(lh.total_hours, 2) as total_hours,
  CASE
    WHEN th.total > 0 THEN ROUND((lh.total_hours / th.total) * 100, 1)
    ELSE 0
  END as percentage
FROM label_hours lh, total_hours th
ORDER BY total_hours DESC;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 8. Week Comparison Function
-- ============================================================================
CREATE OR REPLACE FUNCTION get_week_comparison(
  p_user_id UUID,
  p_current_week_start DATE,
  p_last_week_start DATE
)
RETURNS TABLE(
  area TEXT,
  current_week_hours NUMERIC,
  last_week_hours NUMERIC,
  delta_hours NUMERIC,
  delta_percentage NUMERIC
) AS $$
WITH current_week AS (
  SELECT
    area,
    COALESCE(SUM(duration_minutes) / 60.0, 0) as hours
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_current_week_start
    AND DATE(start_time) < p_current_week_start + INTERVAL '7 days'
    AND end_time IS NOT NULL
    AND area IS NOT NULL
  GROUP BY area
),
last_week AS (
  SELECT
    area,
    COALESCE(SUM(duration_minutes) / 60.0, 0) as hours
  FROM deep_work_log
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_last_week_start
    AND DATE(start_time) < p_last_week_start + INTERVAL '7 days'
    AND end_time IS NOT NULL
    AND area IS NOT NULL
  GROUP BY area
),
all_areas AS (
  SELECT DISTINCT area FROM current_week
  UNION
  SELECT DISTINCT area FROM last_week
)
SELECT
  aa.area,
  ROUND(COALESCE(cw.hours, 0), 2) as current_week_hours,
  ROUND(COALESCE(lw.hours, 0), 2) as last_week_hours,
  ROUND(COALESCE(cw.hours, 0) - COALESCE(lw.hours, 0), 2) as delta_hours,
  CASE
    WHEN COALESCE(lw.hours, 0) > 0
    THEN ROUND(((COALESCE(cw.hours, 0) - COALESCE(lw.hours, 0)) / lw.hours) * 100, 1)
    WHEN COALESCE(cw.hours, 0) > 0
    THEN 100.0
    ELSE 0
  END as delta_percentage
FROM all_areas aa
LEFT JOIN current_week cw ON aa.area = cw.area
LEFT JOIN last_week lw ON aa.area = lw.area
ORDER BY current_week_hours DESC;
$$ LANGUAGE SQL STABLE;
