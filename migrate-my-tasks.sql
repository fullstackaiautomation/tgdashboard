-- Migrate existing tasks to new schema
-- Add user_id to all existing tasks

UPDATE tasks
SET user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
WHERE user_id IS NULL;

-- Verify the migration
SELECT
  COUNT(*) as total_tasks,
  COUNT(user_id) as tasks_with_user_id,
  COUNT(DISTINCT area) as unique_areas,
  COUNT(DISTINCT status) as unique_statuses
FROM tasks;
