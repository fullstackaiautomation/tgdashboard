-- Migration: Create task_time_logs table
-- Purpose: Track hours worked on tasks across multiple dates with notes
-- This allows detailed time tracking for tasks that span multiple days

CREATE TABLE IF NOT EXISTS task_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- Time tracking
  log_date DATE NOT NULL,
  hours_worked DECIMAL(5, 2) NOT NULL CHECK (hours_worked > 0),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX idx_task_time_logs_log_date ON task_time_logs(log_date);

-- RLS Policies
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time logs"
  ON task_time_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time logs"
  ON task_time_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time logs"
  ON task_time_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time logs"
  ON task_time_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_task_time_logs_updated_at
  BEFORE UPDATE ON task_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE task_time_logs IS 'Time tracking log entries for tasks - tracks hours worked on specific dates with notes';
