-- Delete sample/test tasks
-- WARNING: Review the tasks before running to ensure you're not deleting real data!

-- First, let's see what we're about to delete (run this first)
SELECT id, task_name, created_at, user_id
FROM tasks
ORDER BY created_at DESC
LIMIT 20;

-- If you're sure you want to delete all tasks (DANGEROUS - backup first!):
-- DELETE FROM tasks WHERE created_at > '2025-10-09' AND task_name LIKE '%test%';

-- Or delete tasks from a specific date range:
-- DELETE FROM tasks WHERE created_at::date = '2025-10-09';

-- Or delete tasks without a business/life_area (orphaned tasks):
-- DELETE FROM tasks WHERE business_id IS NULL AND life_area_id IS NULL;
