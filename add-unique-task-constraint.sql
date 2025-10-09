-- Add unique constraint to prevent duplicate tasks in the same phase
-- This ensures that a user cannot create two tasks with the same name in the same phase

-- Create unique index for tasks within a phase
CREATE UNIQUE INDEX IF NOT EXISTS tasks_unique_per_phase
ON tasks(task_name, project_id, phase_id, user_id)
WHERE phase_id IS NOT NULL;

-- Create unique index for tasks in a project (but not in a specific phase)
CREATE UNIQUE INDEX IF NOT EXISTS tasks_unique_per_project
ON tasks(task_name, project_id, user_id)
WHERE project_id IS NOT NULL AND phase_id IS NULL;

-- Create unique index for tasks in a business (but not in a specific project)
CREATE UNIQUE INDEX IF NOT EXISTS tasks_unique_per_business
ON tasks(task_name, business_id, user_id)
WHERE business_id IS NOT NULL AND project_id IS NULL;

-- Create unique index for tasks in a life area
CREATE UNIQUE INDEX IF NOT EXISTS tasks_unique_per_life_area
ON tasks(task_name, life_area_id, user_id)
WHERE life_area_id IS NOT NULL;

-- Verify the indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tasks'
  AND indexname LIKE 'tasks_unique%'
ORDER BY indexname;
