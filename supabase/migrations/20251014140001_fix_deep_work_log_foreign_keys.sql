-- Ensure deep_work_log has proper foreign key relationship to tasks table

-- First, clean up any orphaned task_id references (tasks that were deleted)
UPDATE deep_work_log
SET task_id = NULL
WHERE task_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = deep_work_log.task_id
  );

-- Drop existing foreign key if it exists
ALTER TABLE deep_work_log
DROP CONSTRAINT IF EXISTS deep_work_log_task_id_fkey;

-- Recreate the foreign key with ON DELETE SET NULL
-- This allows the relationship to work with Supabase's automatic joins
ALTER TABLE deep_work_log
ADD CONSTRAINT deep_work_log_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES tasks(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_deep_work_log_task_id ON deep_work_log(task_id);

COMMENT ON CONSTRAINT deep_work_log_task_id_fkey ON deep_work_log IS 'Foreign key to tasks table, set to NULL if task is deleted';
