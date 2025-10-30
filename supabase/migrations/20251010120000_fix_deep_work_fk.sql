-- Fix deep_work_sessions foreign key constraint
-- Drop and recreate the constraint with proper name

-- First, drop the existing constraint if it exists
ALTER TABLE deep_work_sessions
  DROP CONSTRAINT IF EXISTS deep_work_sessions_task_id_fkey;

-- Add it back with the correct reference
ALTER TABLE deep_work_sessions
  ADD CONSTRAINT deep_work_sessions_task_id_fkey
  FOREIGN KEY (task_id)
  REFERENCES tasks(id)
  ON DELETE SET NULL;
