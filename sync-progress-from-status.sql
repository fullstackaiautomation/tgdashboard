-- Sync progress_percentage with existing task status
-- This updates all tasks to have progress_percentage match their status

UPDATE tasks
SET progress_percentage = CASE
  WHEN status = 'Done' THEN 100
  WHEN status = 'In progress' THEN 50
  WHEN status = 'Not started' THEN 0
  ELSE COALESCE(progress_percentage, 0)
END
WHERE progress_percentage IS NULL OR progress_percentage = 0;
