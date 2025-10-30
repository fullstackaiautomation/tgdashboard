-- Story 4.1: Recreate deep_work_sessions table with proper schema
-- This replaces the simpler deep_work_log table with a comprehensive solution

-- Create deep_work_sessions table
CREATE TABLE IF NOT EXISTS deep_work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships (mutually exclusive: business XOR life_area, or neither for unallocated)
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Session details
  session_name TEXT,
  labels TEXT[] DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
      ELSE NULL
    END
  ) STORED,
  notes TEXT,

  -- Session metadata (for future stories 4.6)
  is_planned BOOLEAN DEFAULT FALSE,
  was_interrupted BOOLEAN DEFAULT FALSE,
  interruption_reason TEXT,
  goal_achieved BOOLEAN,
  session_quality_rating INTEGER CHECK (session_quality_rating >= 1 AND session_quality_rating <= 5),

  -- Session status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  paused_duration INTEGER DEFAULT 0, -- Total paused time in seconds

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_business_or_life_area CHECK (
    (business_id IS NOT NULL AND life_area_id IS NULL) OR
    (business_id IS NULL AND life_area_id IS NOT NULL) OR
    (business_id IS NULL AND life_area_id IS NULL)
  ),
  CONSTRAINT check_end_after_start CHECK (end_time IS NULL OR end_time > start_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deep_work_user_id ON deep_work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_work_business_id ON deep_work_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_deep_work_life_area_id ON deep_work_sessions(life_area_id);
CREATE INDEX IF NOT EXISTS idx_deep_work_project_id ON deep_work_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_deep_work_task_id ON deep_work_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_deep_work_start_time ON deep_work_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_deep_work_status ON deep_work_sessions(status);
CREATE INDEX IF NOT EXISTS idx_deep_work_labels ON deep_work_sessions USING GIN(labels);
CREATE INDEX IF NOT EXISTS idx_deep_work_is_planned ON deep_work_sessions(is_planned);
CREATE INDEX IF NOT EXISTS idx_deep_work_was_interrupted ON deep_work_sessions(was_interrupted);
CREATE INDEX IF NOT EXISTS idx_deep_work_goal_achieved ON deep_work_sessions(goal_achieved);

-- Composite index for aggregation queries would be created separately if needed
-- Expression indexes with DATE() require special handling

-- Enable RLS
ALTER TABLE deep_work_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sessions" ON deep_work_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON deep_work_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON deep_work_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON deep_work_sessions;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
  ON deep_work_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON deep_work_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON deep_work_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON deep_work_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE deep_work_sessions IS 'Tracks focused work sessions with metadata for productivity insights';
COMMENT ON COLUMN deep_work_sessions.business_id IS 'Link to business entity (mutually exclusive with life_area_id)';
COMMENT ON COLUMN deep_work_sessions.life_area_id IS 'Link to life area (mutually exclusive with business_id)';
COMMENT ON COLUMN deep_work_sessions.labels IS 'Array of labels for cross-cutting categorization (e.g., "$$$ Printer $$$")';
COMMENT ON COLUMN deep_work_sessions.is_planned IS 'Whether session was pre-scheduled (TRUE) or reactive (FALSE)';
COMMENT ON COLUMN deep_work_sessions.was_interrupted IS 'Whether session was interrupted before natural completion';
COMMENT ON COLUMN deep_work_sessions.interruption_reason IS 'Reason for interruption if was_interrupted is TRUE';
COMMENT ON COLUMN deep_work_sessions.goal_achieved IS 'Whether session accomplished its intended goal (TRUE/FALSE/NULL for partial)';
COMMENT ON COLUMN deep_work_sessions.session_quality_rating IS 'Self-assessed quality rating (1-5 scale)';
COMMENT ON COLUMN deep_work_sessions.paused_duration IS 'Total time paused in seconds';
COMMENT ON COLUMN deep_work_sessions.status IS 'Session status: active (running), paused, completed, cancelled';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deep_work_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deep_work_sessions_updated_at ON deep_work_sessions;

CREATE TRIGGER update_deep_work_sessions_updated_at
  BEFORE UPDATE ON deep_work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_deep_work_sessions_updated_at();
