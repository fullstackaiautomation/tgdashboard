-- Story 1.6: Tasks Hub Performance Optimization
-- Create error_logs table for production error monitoring

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'QUERY', 'SYNC')),
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB -- Additional context (URL, status, etc.)
);

-- Create index for querying errors by user and timestamp
CREATE INDEX IF NOT EXISTS idx_error_logs_user_timestamp ON error_logs(user_id, timestamp DESC);

-- Create index for querying errors by task
CREATE INDEX IF NOT EXISTS idx_error_logs_task ON error_logs(task_id) WHERE task_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own error logs
CREATE POLICY error_logs_user_policy ON error_logs
  FOR ALL
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE error_logs IS 'Stores application errors for debugging and monitoring';
COMMENT ON COLUMN error_logs.operation IS 'Type of operation that failed: INSERT, UPDATE, DELETE, QUERY, SYNC';
COMMENT ON COLUMN error_logs.metadata IS 'Additional context about the error (JSON)';
