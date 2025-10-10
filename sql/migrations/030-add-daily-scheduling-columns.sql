-- Story 1.4: Bidirectional Sync - Daily Pages to Tasks Hub
-- Add scheduling and recurrence columns to tasks table

-- Add scheduled_date column for daily planning
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Add scheduled_time column for time-specific scheduling
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add recurrence_pattern column for recurring tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

-- Add constraint for recurrence_pattern (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_pattern_check'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_recurrence_pattern_check
    CHECK (recurrence_pattern IN ('none', 'daily', 'daily_weekdays', 'weekly', 'monthly', 'custom'));
  END IF;
END $$;

-- Add recurrence_parent_id for linking recurring task instances
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for performance on date filtering
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent ON tasks(recurrence_parent_id);

-- Comments
COMMENT ON COLUMN tasks.scheduled_date IS 'Date when task is scheduled to be worked on (different from due_date which is deadline)';
COMMENT ON COLUMN tasks.scheduled_time IS 'Optional time for daily schedule view (e.g., 9:00 AM)';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'Recurrence pattern: none, daily, daily_weekdays, weekly, monthly, custom';
COMMENT ON COLUMN tasks.recurrence_parent_id IS 'For recurring task instances, references the parent template task';
