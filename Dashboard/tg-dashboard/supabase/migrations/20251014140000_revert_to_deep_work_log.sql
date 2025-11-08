-- Revert to using deep_work_log table
-- This migration restores the simple, working approach

-- First, ensure deep_work_log has the duration_minutes calculated column
ALTER TABLE deep_work_log
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER
GENERATED ALWAYS AS (
  CASE
    WHEN end_time IS NOT NULL
    THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ELSE NULL
  END
) STORED;

-- Add status column if it doesn't exist (for active/paused/completed tracking)
ALTER TABLE deep_work_log
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add labels column for tagging if it doesn't exist
ALTER TABLE deep_work_log
ADD COLUMN IF NOT EXISTS labels TEXT[];

-- Add completion_notes if it doesn't exist
ALTER TABLE deep_work_log
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deep_work_log_user_start ON deep_work_log(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_deep_work_log_area ON deep_work_log(area);
CREATE INDEX IF NOT EXISTS idx_deep_work_log_task_type ON deep_work_log(task_type);
CREATE INDEX IF NOT EXISTS idx_deep_work_log_status ON deep_work_log(status);

-- Drop the complex deep_work_sessions table
DROP TABLE IF EXISTS deep_work_sessions CASCADE;

-- Drop existing functions so we can recreate them with new return types
DROP FUNCTION IF EXISTS get_daily_time_allocation(UUID, DATE);
DROP FUNCTION IF EXISTS get_weekly_time_allocation(UUID, DATE);
DROP FUNCTION IF EXISTS get_monthly_time_trend(UUID, DATE);
DROP FUNCTION IF EXISTS get_area_labels(UUID, TEXT);
DROP FUNCTION IF EXISTS get_time_allocation_summary(UUID, DATE, DATE);

-- Recreate the time allocation functions to use deep_work_log
CREATE OR REPLACE FUNCTION get_daily_time_allocation(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  area TEXT,
  task_type TEXT,
  total_minutes INTEGER,
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dwl.area,
    dwl.task_type,
    SUM(dwl.duration_minutes)::INTEGER as total_minutes,
    COUNT(*)::INTEGER as session_count
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) = p_date
    AND dwl.end_time IS NOT NULL
  GROUP BY dwl.area, dwl.task_type;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_weekly_time_allocation(p_user_id UUID, p_start_date DATE)
RETURNS TABLE (
  area TEXT,
  task_type TEXT,
  day_of_week INTEGER,
  total_minutes INTEGER,
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dwl.area,
    dwl.task_type,
    EXTRACT(DOW FROM dwl.start_time)::INTEGER as day_of_week,
    SUM(dwl.duration_minutes)::INTEGER as total_minutes,
    COUNT(*)::INTEGER as session_count
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_start_date
    AND DATE(dwl.start_time) < p_start_date + INTERVAL '7 days'
    AND dwl.end_time IS NOT NULL
  GROUP BY dwl.area, dwl.task_type, day_of_week;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_monthly_time_trend(p_user_id UUID, p_start_date DATE)
RETURNS TABLE (
  date DATE,
  area TEXT,
  total_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(dwl.start_time) as date,
    dwl.area,
    SUM(dwl.duration_minutes)::INTEGER as total_minutes
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_start_date
    AND DATE(dwl.start_time) < p_start_date + INTERVAL '30 days'
    AND dwl.end_time IS NOT NULL
  GROUP BY DATE(dwl.start_time), dwl.area
  ORDER BY date, area;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_area_labels(p_user_id UUID, p_area TEXT DEFAULT NULL)
RETURNS TABLE (label TEXT, usage_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    UNNEST(dwl.labels) as label,
    COUNT(*)::INTEGER as usage_count
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND dwl.labels IS NOT NULL
    AND (p_area IS NULL OR dwl.area = p_area)
  GROUP BY label
  ORDER BY usage_count DESC, label;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_time_allocation_summary(p_user_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  area TEXT,
  total_minutes INTEGER,
  session_count INTEGER,
  avg_session_minutes INTEGER,
  most_common_task_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH area_stats AS (
    SELECT
      dwl.area,
      SUM(dwl.duration_minutes)::INTEGER as total_minutes,
      COUNT(*)::INTEGER as session_count,
      AVG(dwl.duration_minutes)::INTEGER as avg_session_minutes
    FROM deep_work_log dwl
    WHERE dwl.user_id = p_user_id
      AND DATE(dwl.start_time) >= p_start_date
      AND DATE(dwl.start_time) <= p_end_date
      AND dwl.end_time IS NOT NULL
    GROUP BY dwl.area
  ),
  top_task_types AS (
    SELECT DISTINCT ON (dwl.area)
      dwl.area,
      dwl.task_type
    FROM deep_work_log dwl
    WHERE dwl.user_id = p_user_id
      AND DATE(dwl.start_time) >= p_start_date
      AND DATE(dwl.start_time) <= p_end_date
      AND dwl.end_time IS NOT NULL
    GROUP BY dwl.area, dwl.task_type
    ORDER BY dwl.area, COUNT(*) DESC
  )
  SELECT
    a.area,
    a.total_minutes,
    a.session_count,
    a.avg_session_minutes,
    t.task_type as most_common_task_type
  FROM area_stats a
  LEFT JOIN top_task_types t ON a.area = t.area
  ORDER BY a.total_minutes DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE deep_work_log IS 'Simple deep work session tracking with area and task_type strings';
COMMENT ON COLUMN deep_work_log.duration_minutes IS 'Auto-calculated from start_time and end_time';
COMMENT ON COLUMN deep_work_log.status IS 'Session status: active, paused, or completed';
COMMENT ON COLUMN deep_work_log.labels IS 'Array of custom labels for categorization';
