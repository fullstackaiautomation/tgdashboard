-- Fix deep_work_sessions foreign key to point to correct table
-- The tasks are actually in "TG To Do List" table, not "tasks" table

-- Drop the existing foreign key constraint
ALTER TABLE deep_work_sessions
  DROP CONSTRAINT IF EXISTS deep_work_sessions_task_id_fkey;

-- Make task_id optional - deep work sessions don't have to be linked to a task
-- They can be standalone or just linked to business/life_area/project/phase
-- No need to add a new foreign key constraint - task_id can be NULL and that's fine
