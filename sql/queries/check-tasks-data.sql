-- Check what's actually in the tasks table
SELECT
  id,
  description,
  status,
  progress_percentage,
  phase_id,
  updated_at
FROM tasks
WHERE phase_id IS NOT NULL
ORDER BY phase_id, created_at
LIMIT 20;
