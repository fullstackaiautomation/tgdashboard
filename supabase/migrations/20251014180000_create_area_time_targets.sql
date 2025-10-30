-- Migration: Create area_time_targets and user_settings tables for Story 4.5
-- Time Allocation Targets & Planning

-- ============================================================================
-- 1. Create area_time_targets table
-- ============================================================================
CREATE TABLE IF NOT EXISTS area_time_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health')),
  target_hours_per_week INTEGER NOT NULL CHECK (target_hours_per_week >= 0 AND target_hours_per_week <= 168),
  temporary_target_override INTEGER DEFAULT NULL CHECK (temporary_target_override IS NULL OR (temporary_target_override >= 0 AND temporary_target_override <= 168)),
  override_start_date DATE DEFAULT NULL,
  override_end_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- Create indexes for target queries
CREATE INDEX IF NOT EXISTS idx_area_targets_user_area ON area_time_targets(user_id, area);
CREATE INDEX IF NOT EXISTS idx_area_targets_override_dates ON area_time_targets(override_start_date, override_end_date);

-- Enable RLS on area_time_targets
ALTER TABLE area_time_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own area targets"
  ON area_time_targets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own area targets"
  ON area_time_targets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own area targets"
  ON area_time_targets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own area targets"
  ON area_time_targets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Create user_settings table for available work hours
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_work_hours_per_week INTEGER DEFAULT 40 CHECK (available_work_hours_per_week > 0 AND available_work_hours_per_week <= 168),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. Helper function: Get effective target (considering temporary overrides)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_effective_target(
  p_regular_target INTEGER,
  p_temporary_override INTEGER,
  p_override_start DATE,
  p_override_end DATE
)
RETURNS INTEGER AS $$
BEGIN
  IF p_temporary_override IS NOT NULL
     AND p_override_start IS NOT NULL
     AND p_override_end IS NOT NULL
     AND CURRENT_DATE >= p_override_start
     AND CURRENT_DATE <= p_override_end THEN
    RETURN p_temporary_override;
  ELSE
    RETURN p_regular_target;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 4. Get planned vs. actual for all areas
-- ============================================================================
CREATE OR REPLACE FUNCTION get_planned_vs_actual(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE(
  area TEXT,
  target_hours INTEGER,
  actual_hours NUMERIC,
  percentage NUMERIC,
  status TEXT,
  is_temporary_override BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    att.area,
    get_effective_target(
      att.target_hours_per_week,
      att.temporary_target_override,
      att.override_start_date,
      att.override_end_date
    ) as target_hours,
    COALESCE(ROUND(SUM(dwl.duration_minutes) / 60.0, 2), 0) as actual_hours,
    CASE
      WHEN get_effective_target(
        att.target_hours_per_week,
        att.temporary_target_override,
        att.override_start_date,
        att.override_end_date
      ) > 0 THEN
        ROUND((COALESCE(SUM(dwl.duration_minutes) / 60.0, 0) / get_effective_target(
          att.target_hours_per_week,
          att.temporary_target_override,
          att.override_start_date,
          att.override_end_date
        )) * 100, 0)
      ELSE 0
    END as percentage,
    CASE
      WHEN get_effective_target(
        att.target_hours_per_week,
        att.temporary_target_override,
        att.override_start_date,
        att.override_end_date
      ) IS NULL THEN 'no_target'
      WHEN COALESCE(SUM(dwl.duration_minutes) / 60.0, 0) >= get_effective_target(
        att.target_hours_per_week,
        att.temporary_target_override,
        att.override_start_date,
        att.override_end_date
      ) THEN 'on_track'
      WHEN COALESCE(SUM(dwl.duration_minutes) / 60.0, 0) >= get_effective_target(
        att.target_hours_per_week,
        att.temporary_target_override,
        att.override_start_date,
        att.override_end_date
      ) * 0.8 THEN 'at_risk'
      ELSE 'behind'
    END as status,
    (att.temporary_target_override IS NOT NULL
     AND att.override_start_date IS NOT NULL
     AND att.override_end_date IS NOT NULL
     AND CURRENT_DATE >= att.override_start_date
     AND CURRENT_DATE <= att.override_end_date) as is_temporary_override
  FROM area_time_targets att
  LEFT JOIN deep_work_log dwl ON att.area = dwl.area
    AND dwl.user_id = p_user_id
    AND DATE(dwl.start_time) >= p_week_start
    AND DATE(dwl.start_time) < p_week_start + INTERVAL '7 days'
    AND dwl.end_time IS NOT NULL
  WHERE att.user_id = p_user_id
  GROUP BY att.area, att.target_hours_per_week, att.temporary_target_override,
    att.override_start_date, att.override_end_date
  ORDER BY att.area;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. Detect target mismatches (for recommendations)
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_target_mismatches(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_recommendations JSONB := '[]'::JSONB;
  v_record RECORD;
  v_avg_actual NUMERIC;
  v_target INTEGER;
BEGIN
  -- Check all areas with targets
  FOR v_record IN
    SELECT
      att.area,
      att.target_hours_per_week as target,
      (
        SELECT AVG(weekly_hours)::NUMERIC
        FROM (
          SELECT
            DATE_TRUNC('week', dwl.start_time) as week,
            SUM(dwl.duration_minutes) / 60.0 as weekly_hours
          FROM deep_work_log dwl
          WHERE dwl.user_id = p_user_id
            AND dwl.area = att.area
            AND dwl.start_time >= NOW() - INTERVAL '4 weeks'
            AND dwl.end_time IS NOT NULL
          GROUP BY DATE_TRUNC('week', dwl.start_time)
        ) weeks
        HAVING COUNT(*) >= 3
      ) as avg_actual
    FROM area_time_targets att
    WHERE att.user_id = p_user_id
      AND att.target_hours_per_week IS NOT NULL
  LOOP
    v_avg_actual := COALESCE(v_record.avg_actual, 0);
    v_target := v_record.target;

    -- Only create recommendations if we have data
    IF v_record.avg_actual IS NOT NULL THEN
      IF v_avg_actual > v_target * 1.2 THEN
        v_recommendations := v_recommendations || jsonb_build_object(
          'area', v_record.area,
          'current_target', v_target,
          'suggested_target', CEIL(v_avg_actual),
          'avg_actual', ROUND(v_avg_actual, 1),
          'reason', 'consistent_over',
          'message', format('Averaging %.1fh/week but target is %sh - consider increasing to %sh',
            v_avg_actual, v_target, CEIL(v_avg_actual))
        );
      ELSIF v_avg_actual < v_target * 0.8 AND v_avg_actual > 0 THEN
        v_recommendations := v_recommendations || jsonb_build_object(
          'area', v_record.area,
          'current_target', v_target,
          'suggested_target', CEIL(v_avg_actual),
          'avg_actual', ROUND(v_avg_actual, 1),
          'reason', 'consistent_under',
          'message', format('Averaging %.1fh/week but target is %sh - consider decreasing to %sh',
            v_avg_actual, v_target, CEIL(v_avg_actual))
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_recommendations;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 6. Weekly forecast
-- ============================================================================
CREATE OR REPLACE FUNCTION forecast_weekly_targets(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE(
  area TEXT,
  target_hours INTEGER,
  actual_hours NUMERIC,
  days_elapsed INTEGER,
  projected_hours NUMERIC,
  status TEXT
) AS $$
DECLARE
  v_days_elapsed INTEGER;
BEGIN
  -- Calculate days elapsed in current week (1-7)
  v_days_elapsed := (CURRENT_DATE - p_week_start) + 1;
  IF v_days_elapsed < 1 THEN
    v_days_elapsed := 1;
  ELSIF v_days_elapsed > 7 THEN
    v_days_elapsed := 7;
  END IF;

  RETURN QUERY
  SELECT
    pva.area,
    pva.target_hours,
    pva.actual_hours,
    v_days_elapsed,
    CASE
      WHEN v_days_elapsed > 0 AND pva.actual_hours > 0 THEN
        ROUND((pva.actual_hours / v_days_elapsed) * 7, 2)
      ELSE 0
    END as projected_hours,
    CASE
      WHEN pva.target_hours IS NULL OR pva.target_hours = 0 THEN 'no_target'
      WHEN v_days_elapsed > 0 AND (pva.actual_hours / v_days_elapsed) * 7 >= pva.target_hours THEN 'on_track'
      WHEN v_days_elapsed > 0 AND (pva.actual_hours / v_days_elapsed) * 7 >= pva.target_hours * 0.8 THEN 'at_risk'
      ELSE 'unlikely'
    END as status
  FROM get_planned_vs_actual(p_user_id, p_week_start) pva
  WHERE pva.target_hours IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;
