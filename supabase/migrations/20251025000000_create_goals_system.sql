-- Goals & Progress Tracking System
-- Comprehensive goal setting, targets, and weekly check-ins with task integration

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Health', 'Relationships', 'Finance', 'Full Stack', 'Huge Capital', 'S4')),
  goal_statement TEXT NOT NULL,
  target_date DATE NOT NULL,
  primary_metric VARCHAR NOT NULL,
  metric_unit VARCHAR,
  metric_type TEXT CHECK (metric_type IN ('numeric', 'qualitative')) NOT NULL DEFAULT 'numeric',
  status TEXT CHECK (status IN ('active', 'achieved', 'paused', 'abandoned')) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal Targets Table (weekly/monthly targets)
CREATE TABLE IF NOT EXISTS goal_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  target_name VARCHAR NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_value NUMERIC NOT NULL,
  target_unit VARCHAR,
  contribution_type TEXT CHECK (contribution_type IN ('count', 'duration', 'metric')) NOT NULL DEFAULT 'count',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal-Task Links Table (for automatic progress tracking)
CREATE TABLE IF NOT EXISTS goal_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_id UUID REFERENCES goal_targets(id) ON DELETE SET NULL,
  contribution_type TEXT CHECK (contribution_type IN ('count', 'duration')) NOT NULL DEFAULT 'count',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, task_id, target_id)
);

-- Goal Check-Ins Table (weekly Sunday reviews)
CREATE TABLE IF NOT EXISTS goal_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  targets_hit NUMERIC,
  targets_total NUMERIC,
  overall_percentage NUMERIC,
  metric_snapshot JSONB,
  qualitative_feedback TEXT,
  feeling_question VARCHAR,
  sustainability_question VARCHAR,
  obstacles_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, checkin_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_area ON goals(user_id, area);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_targets_goal_id ON goal_targets(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_task_links_goal_id ON goal_task_links(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_task_links_task_id ON goal_task_links(task_id);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_goal_id ON goal_checkins(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_checkins_date ON goal_checkins(goal_id, checkin_date DESC);

-- RLS Policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own goals" ON goals;
CREATE POLICY "Users can manage their own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE goal_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage goal targets" ON goal_targets;
CREATE POLICY "Users can manage goal targets"
  ON goal_targets FOR ALL
  USING (
    goal_id IN (
      SELECT id FROM goals WHERE user_id = auth.uid()
    )
  );

ALTER TABLE goal_task_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage goal-task links" ON goal_task_links;
CREATE POLICY "Users can manage goal-task links"
  ON goal_task_links FOR ALL
  USING (
    goal_id IN (
      SELECT id FROM goals WHERE user_id = auth.uid()
    )
  );

ALTER TABLE goal_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage goal check-ins" ON goal_checkins;
CREATE POLICY "Users can manage goal check-ins"
  ON goal_checkins FOR ALL
  USING (
    goal_id IN (
      SELECT id FROM goals WHERE user_id = auth.uid()
    )
  );

-- Function: Get Goal Progress for a Period
CREATE OR REPLACE FUNCTION get_goal_progress(
  p_goal_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  goal_id UUID,
  targets_hit NUMERIC,
  targets_total NUMERIC,
  completion_percentage NUMERIC
) AS $$
DECLARE
  v_user_id UUID;
  v_targets_completed NUMERIC;
  v_total_targets NUMERIC;
BEGIN
  -- Get user_id from goal
  SELECT user_id INTO v_user_id FROM goals WHERE id = p_goal_id;

  -- Count completed targets for the period
  SELECT COUNT(*) INTO v_targets_completed
  FROM goal_targets gt
  WHERE gt.goal_id = p_goal_id
    AND gt.frequency IN ('daily', 'weekly', 'monthly');

  -- Get total targets
  SELECT COUNT(*) INTO v_total_targets
  FROM goal_targets gt
  WHERE gt.goal_id = p_goal_id;

  RETURN QUERY
  SELECT
    p_goal_id,
    COALESCE(v_targets_completed, 0),
    COALESCE(v_total_targets, 0),
    CASE WHEN v_total_targets > 0
      THEN (v_targets_completed::NUMERIC / v_total_targets::NUMERIC * 100)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Weekly Target Completion
CREATE OR REPLACE FUNCTION get_weekly_target_completion(
  p_goal_id UUID,
  p_week_start_date DATE
)
RETURNS TABLE (
  target_id UUID,
  target_name VARCHAR,
  target_value NUMERIC,
  target_unit VARCHAR,
  completed_count NUMERIC,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gt.id,
    gt.target_name,
    gt.target_value,
    gt.target_unit,
    COALESCE(
      SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END),
      0
    )::NUMERIC as completed_count,
    CASE WHEN gt.target_value > 0
      THEN COALESCE(
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END),
        0
      )::NUMERIC / gt.target_value * 100
      ELSE 0
    END as completion_percentage
  FROM goal_targets gt
  LEFT JOIN goal_task_links gtl ON gt.id = gtl.target_id
  LEFT JOIN tasks t ON gtl.task_id = t.id
    AND t.completed_at >= (p_week_start_date::TIMESTAMPTZ)
    AND t.completed_at < (p_week_start_date + INTERVAL '7 days')::TIMESTAMPTZ
  WHERE gt.goal_id = p_goal_id
  GROUP BY gt.id, gt.target_name, gt.target_value, gt.target_unit
  ORDER BY gt.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if today is Sunday and return this week's Sunday date
CREATE OR REPLACE FUNCTION get_sunday_date(p_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Returns the Sunday of the week containing p_date
  RETURN p_date - INTERVAL '1 day' * EXTRACT(DOW FROM p_date);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
