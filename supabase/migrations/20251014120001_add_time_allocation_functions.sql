-- Story 4.1: Time Allocation Calculation Functions
-- These functions calculate time spent per business/life area across daily/weekly/monthly periods

-- Daily time allocation by business/life area
CREATE OR REPLACE FUNCTION calculate_daily_allocation(
  p_user_id UUID,
  p_date DATE
)
RETURNS JSONB AS $$
  SELECT COALESCE(
    jsonb_object_agg(area_name, hours),
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
      AND dws.duration_minutes IS NOT NULL
    GROUP BY COALESCE(b.name, la.name, 'Unallocated')
  ) allocation;
$$ LANGUAGE SQL STABLE;

-- Weekly allocation (7 days, grouped by business/life area)
CREATE OR REPLACE FUNCTION calculate_weekly_allocation(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE(
  day_date DATE,
  area_name TEXT,
  hours NUMERIC,
  area_type TEXT, -- 'business' or 'life_area'
  color TEXT
) AS $$
  SELECT
    DATE(dws.start_time) as day_date,
    COALESCE(b.name, la.name, 'Unallocated') as area_name,
    ROUND(SUM(dws.duration_minutes) / 60.0, 2) as hours,
    CASE
      WHEN dws.business_id IS NOT NULL THEN 'business'
      WHEN dws.life_area_id IS NOT NULL THEN 'life_area'
      ELSE 'unallocated'
    END as area_type,
    COALESCE(b.color, la.color, '#6B7280') as color
  FROM deep_work_sessions dws
  LEFT JOIN businesses b ON dws.business_id = b.id
  LEFT JOIN life_areas la ON dws.life_area_id = la.id
  WHERE dws.user_id = p_user_id
    AND DATE(dws.start_time) >= p_week_start
    AND DATE(dws.start_time) < p_week_start + INTERVAL '7 days'
    AND dws.status = 'completed'
    AND dws.duration_minutes IS NOT NULL
  GROUP BY DATE(dws.start_time), COALESCE(b.name, la.name, 'Unallocated'),
           CASE
             WHEN dws.business_id IS NOT NULL THEN 'business'
             WHEN dws.life_area_id IS NOT NULL THEN 'life_area'
             ELSE 'unallocated'
           END,
           COALESCE(b.color, la.color, '#6B7280')
  ORDER BY day_date, area_name;
$$ LANGUAGE SQL STABLE;

-- Monthly trend (30 days) by business/life area
CREATE OR REPLACE FUNCTION calculate_monthly_allocation(
  p_user_id UUID,
  p_month_start DATE
)
RETURNS TABLE(
  day_date DATE,
  area_name TEXT,
  hours NUMERIC,
  area_type TEXT,
  color TEXT
) AS $$
  SELECT
    DATE(dws.start_time) as day_date,
    COALESCE(b.name, la.name, 'Unallocated') as area_name,
    ROUND(SUM(dws.duration_minutes) / 60.0, 2) as hours,
    CASE
      WHEN dws.business_id IS NOT NULL THEN 'business'
      WHEN dws.life_area_id IS NOT NULL THEN 'life_area'
      ELSE 'unallocated'
    END as area_type,
    COALESCE(b.color, la.color, '#6B7280') as color
  FROM deep_work_sessions dws
  LEFT JOIN businesses b ON dws.business_id = b.id
  LEFT JOIN life_areas la ON dws.life_area_id = la.id
  WHERE dws.user_id = p_user_id
    AND DATE(dws.start_time) >= p_month_start
    AND DATE(dws.start_time) < p_month_start + INTERVAL '30 days'
    AND dws.status = 'completed'
    AND dws.duration_minutes IS NOT NULL
  GROUP BY DATE(dws.start_time), COALESCE(b.name, la.name, 'Unallocated'),
           CASE
             WHEN dws.business_id IS NOT NULL THEN 'business'
             WHEN dws.life_area_id IS NOT NULL THEN 'life_area'
             ELSE 'unallocated'
           END,
           COALESCE(b.color, la.color, '#6B7280')
  ORDER BY day_date, area_name;
$$ LANGUAGE SQL STABLE;

-- Get time allocation with color information for UI rendering
CREATE OR REPLACE FUNCTION get_time_allocation_with_colors(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  area_id UUID,
  area_name TEXT,
  area_type TEXT,
  total_hours NUMERIC,
  color TEXT,
  session_count INTEGER
) AS $$
  SELECT
    COALESCE(dws.business_id, dws.life_area_id) as area_id,
    COALESCE(b.name, la.name, 'Unallocated') as area_name,
    CASE
      WHEN dws.business_id IS NOT NULL THEN 'business'
      WHEN dws.life_area_id IS NOT NULL THEN 'life_area'
      ELSE 'unallocated'
    END as area_type,
    ROUND(SUM(dws.duration_minutes) / 60.0, 2) as total_hours,
    COALESCE(b.color, la.color, '#6B7280') as color,
    COUNT(*)::INTEGER as session_count
  FROM deep_work_sessions dws
  LEFT JOIN businesses b ON dws.business_id = b.id
  LEFT JOIN life_areas la ON dws.life_area_id = la.id
  WHERE dws.user_id = p_user_id
    AND DATE(dws.start_time) >= p_start_date
    AND DATE(dws.start_time) <= p_end_date
    AND dws.status = 'completed'
    AND dws.duration_minutes IS NOT NULL
  GROUP BY COALESCE(dws.business_id, dws.life_area_id),
           COALESCE(b.name, la.name, 'Unallocated'),
           CASE
             WHEN dws.business_id IS NOT NULL THEN 'business'
             WHEN dws.life_area_id IS NOT NULL THEN 'life_area'
             ELSE 'unallocated'
           END,
           COALESCE(b.color, la.color, '#6B7280')
  ORDER BY total_hours DESC;
$$ LANGUAGE SQL STABLE;

-- Label-based time aggregation
CREATE OR REPLACE FUNCTION get_time_by_label(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  label TEXT,
  total_hours NUMERIC,
  session_count INTEGER
) AS $$
  SELECT
    unnest(labels) as label,
    ROUND(SUM(duration_minutes) / 60.0, 2) as total_hours,
    COUNT(*)::INTEGER as session_count
  FROM deep_work_sessions
  WHERE user_id = p_user_id
    AND DATE(start_time) >= p_start_date
    AND DATE(start_time) <= p_end_date
    AND status = 'completed'
    AND duration_minutes IS NOT NULL
    AND labels IS NOT NULL
    AND array_length(labels, 1) > 0
  GROUP BY unnest(labels)
  ORDER BY total_hours DESC;
$$ LANGUAGE SQL STABLE;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_daily_allocation IS 'Returns JSONB object with area names as keys and hours as values for a specific date';
COMMENT ON FUNCTION calculate_weekly_allocation IS 'Returns time allocation by area for 7 days starting from specified date';
COMMENT ON FUNCTION calculate_monthly_allocation IS 'Returns time allocation by area for 30 days starting from specified date';
COMMENT ON FUNCTION get_time_allocation_with_colors IS 'Returns time allocation with color information for UI rendering';
COMMENT ON FUNCTION get_time_by_label IS 'Aggregates time spent on each label across all sessions';
