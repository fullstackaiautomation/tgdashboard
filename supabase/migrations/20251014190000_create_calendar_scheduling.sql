-- Migration: Calendar and Task Scheduling System
-- Purpose: Enable users to schedule specific tasks to calendar time blocks

-- Table: task_time_blocks
-- Stores scheduled time blocks for tasks
CREATE TABLE IF NOT EXISTS task_time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Time block scheduling
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Duration tracking
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER DEFAULT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),

  -- Notes
  notes TEXT DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_duration CHECK (planned_duration_minutes > 0 AND planned_duration_minutes <= 1440)
);

-- Indexes for performance
CREATE INDEX idx_task_time_blocks_user_id ON task_time_blocks(user_id);
CREATE INDEX idx_task_time_blocks_task_id ON task_time_blocks(task_id);
CREATE INDEX idx_task_time_blocks_date ON task_time_blocks(scheduled_date);
CREATE INDEX idx_task_time_blocks_user_date ON task_time_blocks(user_id, scheduled_date);

-- RLS Policies
ALTER TABLE task_time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task time blocks"
  ON task_time_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task time blocks"
  ON task_time_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task time blocks"
  ON task_time_blocks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task time blocks"
  ON task_time_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- Function: Get calendar view for date range
-- Returns all scheduled time blocks with task details
CREATE OR REPLACE FUNCTION get_calendar_view(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  block_id UUID,
  task_id UUID,
  task_name TEXT,
  area TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status TEXT,
  notes TEXT,
  task_status TEXT,
  task_priority TEXT,
  task_effort_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.id AS block_id,
    ttb.task_id,
    t.task_name,
    t.area,
    ttb.scheduled_date,
    ttb.start_time,
    ttb.end_time,
    ttb.planned_duration_minutes,
    ttb.actual_duration_minutes,
    ttb.status,
    ttb.notes,
    t.status AS task_status,
    t.priority AS task_priority,
    t.effort_level AS task_effort_level
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date BETWEEN p_start_date AND p_end_date
  ORDER BY ttb.scheduled_date, ttb.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function: Get daily schedule
-- Returns time blocks for a specific day
CREATE OR REPLACE FUNCTION get_daily_schedule(
  p_user_id UUID,
  p_date DATE
)
RETURNS TABLE (
  block_id UUID,
  task_id UUID,
  task_name TEXT,
  area TEXT,
  start_time TIME,
  end_time TIME,
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  status TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.id AS block_id,
    ttb.task_id,
    t.task_name,
    t.area,
    ttb.start_time,
    ttb.end_time,
    ttb.planned_duration_minutes,
    ttb.actual_duration_minutes,
    ttb.status,
    ttb.notes
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date = p_date
  ORDER BY ttb.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function: Get weekly calendar summary
-- Returns aggregated time blocks per day for a week
CREATE OR REPLACE FUNCTION get_weekly_calendar_summary(
  p_user_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  scheduled_date DATE,
  total_blocks INTEGER,
  total_planned_minutes INTEGER,
  total_actual_minutes INTEGER,
  areas_scheduled TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.scheduled_date,
    COUNT(*)::INTEGER AS total_blocks,
    SUM(ttb.planned_duration_minutes)::INTEGER AS total_planned_minutes,
    SUM(COALESCE(ttb.actual_duration_minutes, 0))::INTEGER AS total_actual_minutes,
    ARRAY_AGG(DISTINCT t.area) AS areas_scheduled
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date >= p_week_start
    AND ttb.scheduled_date < p_week_start + INTERVAL '7 days'
  GROUP BY ttb.scheduled_date
  ORDER BY ttb.scheduled_date;
END;
$$ LANGUAGE plpgsql;

-- Function: Get unscheduled tasks
-- Returns tasks that need scheduling (active/in_progress with no time blocks)
CREATE OR REPLACE FUNCTION get_unscheduled_tasks(
  p_user_id UUID
)
RETURNS TABLE (
  task_id UUID,
  task_name TEXT,
  area TEXT,
  priority TEXT,
  hours_projected DECIMAL,
  hours_worked DECIMAL,
  hours_remaining DECIMAL,
  due_date DATE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS task_id,
    t.task_name,
    t.area,
    t.priority,
    t.hours_projected,
    t.hours_worked,
    (t.hours_projected - COALESCE(t.hours_worked, 0)) AS hours_remaining,
    t.due_date,
    t.status
  FROM tasks t
  LEFT JOIN task_time_blocks ttb ON t.id = ttb.task_id AND ttb.status IN ('scheduled', 'in_progress')
  WHERE t.user_id = p_user_id
    AND t.status IN ('active', 'in_progress')
    AND t.hours_projected IS NOT NULL
    AND ttb.id IS NULL
  ORDER BY
    CASE t.priority
      WHEN 'High' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'Low' THEN 3
      ELSE 4
    END,
    t.due_date NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function: Check time block conflicts
-- Returns conflicting time blocks for validation
CREATE OR REPLACE FUNCTION check_time_block_conflicts(
  p_user_id UUID,
  p_scheduled_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_block_id UUID DEFAULT NULL
)
RETURNS TABLE (
  block_id UUID,
  task_name TEXT,
  start_time TIME,
  end_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ttb.id AS block_id,
    t.task_name,
    ttb.start_time,
    ttb.end_time
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date = p_scheduled_date
    AND ttb.status IN ('scheduled', 'in_progress')
    AND (p_exclude_block_id IS NULL OR ttb.id != p_exclude_block_id)
    AND (
      (ttb.start_time < p_end_time AND ttb.end_time > p_start_time)
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Get task scheduling analytics
-- Returns statistics about scheduled vs actual time per area
CREATE OR REPLACE FUNCTION get_task_scheduling_analytics(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  area TEXT,
  total_blocks INTEGER,
  total_planned_hours DECIMAL,
  total_actual_hours DECIMAL,
  completion_rate DECIMAL,
  avg_accuracy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.area,
    COUNT(*)::INTEGER AS total_blocks,
    ROUND(SUM(ttb.planned_duration_minutes)::DECIMAL / 60, 2) AS total_planned_hours,
    ROUND(SUM(COALESCE(ttb.actual_duration_minutes, 0))::DECIMAL / 60, 2) AS total_actual_hours,
    ROUND(
      (COUNT(*) FILTER (WHERE ttb.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      1
    ) AS completion_rate,
    ROUND(
      AVG(
        CASE
          WHEN ttb.actual_duration_minutes IS NOT NULL AND ttb.actual_duration_minutes > 0
          THEN (ttb.actual_duration_minutes::DECIMAL / ttb.planned_duration_minutes) * 100
          ELSE NULL
        END
      ),
      1
    ) AS avg_accuracy
  FROM task_time_blocks ttb
  JOIN tasks t ON ttb.task_id = t.id
  WHERE ttb.user_id = p_user_id
    AND ttb.scheduled_date BETWEEN p_start_date AND p_end_date
  GROUP BY t.area
  ORDER BY total_planned_hours DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_time_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_time_blocks_updated_at
  BEFORE UPDATE ON task_time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_time_blocks_updated_at();
