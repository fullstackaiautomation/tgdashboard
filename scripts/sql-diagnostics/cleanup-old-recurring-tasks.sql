-- Identify old recurring task instances (created before parent/child system)
-- These are tasks that have a recurring_type but no recurring_parent_id
-- and their task names contain dates in MM/DD/YY format

SELECT
  id,
  task_name,
  recurring_type,
  recurring_parent_id,
  created_at
FROM tasks
WHERE
  recurring_type IS NOT NULL
  AND recurring_type != 'none'
  AND recurring_parent_id IS NULL
  AND task_name LIKE '% __/__/_%'  -- Matches pattern "Name MM/DD/YY"
ORDER BY created_at DESC;
