-- Story 4.1: Add task_type column for backwards compatibility

ALTER TABLE deep_work_sessions
ADD COLUMN IF NOT EXISTS task_type TEXT;

-- Create index on task_type for filtering
CREATE INDEX IF NOT EXISTS idx_deep_work_task_type ON deep_work_sessions(task_type);

-- Add comment
COMMENT ON COLUMN deep_work_sessions.task_type IS 'Type of task or effort level (e.g., "$$$ Printer $$$", "$ Makes Money $", etc.)';
