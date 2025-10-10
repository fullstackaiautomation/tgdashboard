-- Drop the old TG To Do List table and fix deep_work_sessions FK
-- All data should now be in the tasks table

-- First, add back the foreign key constraint to tasks table
ALTER TABLE deep_work_sessions
  ADD CONSTRAINT deep_work_sessions_task_id_fkey
  FOREIGN KEY (task_id)
  REFERENCES tasks(id)
  ON DELETE SET NULL;

-- Now drop the old TG To Do List table
DROP TABLE IF EXISTS "TG To Do List" CASCADE;
