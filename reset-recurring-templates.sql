-- Reset progress for all recurring parent tasks (templates)
UPDATE tasks
SET 
  progress_percentage = 0,
  status = 'Not started',
  completed_at = NULL
WHERE 
  recurring_type IS NOT NULL 
  AND recurring_type != 'none'
  AND recurrence_parent_id IS NULL;
