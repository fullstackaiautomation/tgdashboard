-- Fix recurring task dates
-- This script will:
-- 1. Delete all recurring task instances (generated tasks)
-- 2. Remove dates from template names
-- 3. App will auto-regenerate instances with correct dates on next load

-- Step 1: Delete all recurring task instances (keep the templates)
DELETE FROM tasks
WHERE recurrence_parent_id IS NOT NULL;

-- Step 2: Remove dates from template task names
-- This removes any date pattern like "10/13/25" or " 10/13/25" from the end of task names
UPDATE tasks
SET task_name = REGEXP_REPLACE(task_name, '\s+\d{2}/\d{2}/\d{2}$', '')
WHERE recurring_type IS NOT NULL
  AND recurring_type != 'none'
  AND recurrence_parent_id IS NULL
  AND task_name ~ '\s+\d{2}/\d{2}/\d{2}$';

-- Step 3: Display updated templates (for verification)
SELECT id, task_name, recurring_type, recurring_interval
FROM tasks
WHERE recurring_type IS NOT NULL
  AND recurring_type != 'none'
  AND recurrence_parent_id IS NULL
ORDER BY task_name;
