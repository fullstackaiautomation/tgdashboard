-- Story 2.1: Task-Level Progress Calculation & Display
-- Add progress_percentage column to tasks table

-- Add progress_percentage column
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Add constraint separately (in case column already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_progress_percentage_check'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_progress_percentage_check
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

-- Create index for filtering by progress
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(progress_percentage);

-- Update existing tasks to have 0% progress if not started, 100% if done
UPDATE tasks
SET progress_percentage = CASE
  WHEN status = 'Done' THEN 100
  WHEN status = 'In progress' THEN 50
  ELSE 0
END
WHERE progress_percentage IS NULL;

-- Comments
COMMENT ON COLUMN tasks.progress_percentage IS 'Task completion percentage: 0-100. Maps to status: 0=Not Started, 1-99=In Progress, 100=Completed';
