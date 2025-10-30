-- Create function for monthly target review and adherence tracking
-- This function analyzes how well users met their weekly targets over a full month

CREATE OR REPLACE FUNCTION get_monthly_target_review(
  p_user_id UUID,
  p_month_start DATE
)
RETURNS JSONB AS $$
DECLARE
  v_month_end DATE;
  v_result JSONB;
  v_areas TEXT[] := ARRAY['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];
  v_area TEXT;
  v_area_results JSONB := '[]'::JSONB;
  v_target_hours INTEGER;
  v_actual_hours NUMERIC;
  v_weeks_in_month INTEGER;
  v_target_total NUMERIC;
  v_adherence_pct NUMERIC;
  v_status TEXT;
BEGIN
  -- Calculate month end (last day of month)
  v_month_end := (DATE_TRUNC('month', p_month_start) + INTERVAL '1 month - 1 day')::DATE;
  
  -- Calculate number of complete weeks in month
  v_weeks_in_month := CEIL(EXTRACT(DAY FROM v_month_end) / 7.0);
  
  -- Analyze each area
  FOR v_area IN SELECT UNNEST(v_areas)
  LOOP
    -- Get current target for this area
    SELECT target_hours_per_week
    INTO v_target_hours
    FROM area_time_targets
    WHERE user_id = p_user_id
      AND area = v_area
    LIMIT 1;
    
    -- Get actual hours logged in the month
    SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
    INTO v_actual_hours
    FROM deep_work_log
    WHERE user_id = p_user_id
      AND area = v_area
      AND DATE(start_time) >= p_month_start
      AND DATE(start_time) <= v_month_end;
    
    -- Calculate target total for month
    v_target_total := COALESCE(v_target_hours, 0) * v_weeks_in_month;
    
    -- Calculate adherence percentage
    IF v_target_total > 0 THEN
      v_adherence_pct := ROUND((v_actual_hours / v_target_total) * 100, 0);
    ELSE
      v_adherence_pct := NULL;
    END IF;
    
    -- Determine status
    IF v_target_hours IS NULL THEN
      v_status := 'no_target';
    ELSIF v_adherence_pct >= 90 THEN
      v_status := 'met';
    ELSIF v_adherence_pct >= 75 THEN
      v_status := 'close';
    ELSE
      v_status := 'missed';
    END IF;
    
    -- Add area result
    v_area_results := v_area_results || jsonb_build_object(
      'area', v_area,
      'target_hours_per_week', v_target_hours,
      'target_total_month', v_target_total,
      'actual_hours', ROUND(v_actual_hours, 1),
      'adherence_percentage', v_adherence_pct,
      'status', v_status,
      'delta_hours', ROUND(v_actual_hours - v_target_total, 1)
    );
  END LOOP;
  
  -- Build final result with summary statistics
  SELECT jsonb_build_object(
    'month_start', p_month_start,
    'month_end', v_month_end,
    'weeks_in_month', v_weeks_in_month,
    'areas', v_area_results,
    'summary', jsonb_build_object(
      'total_with_targets', (SELECT COUNT(*) FROM jsonb_array_elements(v_area_results) WHERE (value->>'target_hours_per_week')::INTEGER IS NOT NULL),
      'targets_met', (SELECT COUNT(*) FROM jsonb_array_elements(v_area_results) WHERE value->>'status' = 'met'),
      'targets_close', (SELECT COUNT(*) FROM jsonb_array_elements(v_area_results) WHERE value->>'status' = 'close'),
      'targets_missed', (SELECT COUNT(*) FROM jsonb_array_elements(v_area_results) WHERE value->>'status' = 'missed'),
      'overall_adherence_pct', (
        SELECT ROUND(AVG((value->>'adherence_percentage')::NUMERIC), 0)
        FROM jsonb_array_elements(v_area_results)
        WHERE (value->>'adherence_percentage')::NUMERIC IS NOT NULL
      )
    )
  )
  INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION get_monthly_target_review IS 'Generates monthly target review showing adherence to weekly targets across all areas for a given month';
