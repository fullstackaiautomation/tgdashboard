-- Migration: Area-level Time Analytics
-- Story 4.2: Add area time stats function and time budgets table

-- Create area_time_budgets table for time budget feature
CREATE TABLE IF NOT EXISTS area_time_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health')),
  target_hours_per_week INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- Enable RLS
ALTER TABLE area_time_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own budgets
CREATE POLICY area_time_budgets_policy ON area_time_budgets FOR ALL USING (user_id = auth.uid());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_area_time_budgets_user_area ON area_time_budgets(user_id, area);

-- Function to get area time stats
-- Returns comprehensive time statistics for a specific area
CREATE OR REPLACE FUNCTION get_area_time_stats(p_user_id UUID, p_area TEXT)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'area', p_area,
    'total_hours', COALESCE(SUM(dwl.duration_minutes) / 60.0, 0),
    'hours_this_week', COALESCE(SUM(
      CASE WHEN dwl.start_time >= NOW() - INTERVAL '7 days'
      THEN dwl.duration_minutes ELSE 0 END
    ) / 60.0, 0),
    'hours_this_month', COALESCE(SUM(
      CASE WHEN dwl.start_time >= NOW() - INTERVAL '30 days'
      THEN dwl.duration_minutes ELSE 0 END
    ) / 60.0, 0),
    'hours_last_week', COALESCE(SUM(
      CASE WHEN dwl.start_time >= NOW() - INTERVAL '14 days' AND dwl.start_time < NOW() - INTERVAL '7 days'
      THEN dwl.duration_minutes ELSE 0 END
    ) / 60.0, 0),
    'avg_hours_per_week', COALESCE(SUM(
      CASE WHEN dwl.start_time >= NOW() - INTERVAL '28 days'
      THEN dwl.duration_minutes ELSE 0 END
    ) / 60.0 / 4, 0),
    'last_session_date', MAX(dwl.start_time),
    'days_since_last', COALESCE(EXTRACT(DAY FROM NOW() - MAX(dwl.start_time))::INTEGER, 999)
  )
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND dwl.area = p_area
    AND dwl.end_time IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Function to get all areas time stats (optimized single query)
CREATE OR REPLACE FUNCTION get_all_areas_time_stats(p_user_id UUID)
RETURNS JSONB AS $$
  WITH area_stats AS (
    SELECT
      area_name,
      COALESCE(SUM(dwl.duration_minutes) / 60.0, 0) as total_hours,
      COALESCE(SUM(
        CASE WHEN dwl.start_time >= NOW() - INTERVAL '7 days'
        THEN dwl.duration_minutes ELSE 0 END
      ) / 60.0, 0) as hours_this_week,
      COALESCE(SUM(
        CASE WHEN dwl.start_time >= NOW() - INTERVAL '30 days'
        THEN dwl.duration_minutes ELSE 0 END
      ) / 60.0, 0) as hours_this_month,
      COALESCE(SUM(
        CASE WHEN dwl.start_time >= NOW() - INTERVAL '14 days' AND dwl.start_time < NOW() - INTERVAL '7 days'
        THEN dwl.duration_minutes ELSE 0 END
      ) / 60.0, 0) as hours_last_week,
      COALESCE(SUM(
        CASE WHEN dwl.start_time >= NOW() - INTERVAL '28 days'
        THEN dwl.duration_minutes ELSE 0 END
      ) / 60.0 / 4, 0) as avg_hours_per_week,
      MAX(dwl.start_time) as last_session_date,
      COALESCE(EXTRACT(DAY FROM NOW() - MAX(dwl.start_time))::INTEGER, 999) as days_since_last
    FROM (VALUES
      ('Full Stack'),
      ('S4'),
      ('808'),
      ('Personal'),
      ('Huge Capital'),
      ('Golf'),
      ('Health')
    ) AS areas(area_name)
    LEFT JOIN deep_work_log dwl ON dwl.area = areas.area_name
      AND dwl.user_id = p_user_id
      AND dwl.end_time IS NOT NULL
    GROUP BY area_name
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'area', area_name,
      'total_hours', total_hours,
      'hours_this_week', hours_this_week,
      'hours_this_month', hours_this_month,
      'hours_last_week', hours_last_week,
      'avg_hours_per_week', avg_hours_per_week,
      'last_session_date', last_session_date,
      'days_since_last', days_since_last
    )
  )
  FROM area_stats;
$$ LANGUAGE SQL STABLE;

-- Function to get historical time trend data (for line charts)
CREATE OR REPLACE FUNCTION get_area_time_trend(p_user_id UUID, p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  date DATE,
  area TEXT,
  hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(dwl.start_time) as date,
    dwl.area,
    ROUND(COALESCE(SUM(dwl.duration_minutes) / 60.0, 0), 2) as hours
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND dwl.start_time >= NOW() - (p_days || ' days')::INTERVAL
    AND dwl.end_time IS NOT NULL
  GROUP BY DATE(dwl.start_time), dwl.area
  ORDER BY date, area;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get label breakdown by area
CREATE OR REPLACE FUNCTION get_area_label_breakdown(p_user_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  area TEXT,
  label TEXT,
  hours NUMERIC,
  session_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dwl.area,
    UNNEST(dwl.labels) as label,
    ROUND(COALESCE(SUM(dwl.duration_minutes) / 60.0, 0), 2) as hours,
    COUNT(*) as session_count
  FROM deep_work_log dwl
  WHERE dwl.user_id = p_user_id
    AND dwl.labels IS NOT NULL
    AND dwl.end_time IS NOT NULL
    AND (p_start_date IS NULL OR DATE(dwl.start_time) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(dwl.start_time) <= p_end_date)
  GROUP BY dwl.area, label
  ORDER BY dwl.area, hours DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE area_time_budgets IS 'Target hours per week for each life area';
COMMENT ON FUNCTION get_area_time_stats(UUID, TEXT) IS 'Get comprehensive time statistics for a specific area';
COMMENT ON FUNCTION get_all_areas_time_stats(UUID) IS 'Get time statistics for all 7 areas in a single optimized query';
COMMENT ON FUNCTION get_area_time_trend(UUID, INTEGER) IS 'Get historical time trend data for line charts';
COMMENT ON FUNCTION get_area_label_breakdown(UUID, DATE, DATE) IS 'Get label breakdown by area for specified date range';
