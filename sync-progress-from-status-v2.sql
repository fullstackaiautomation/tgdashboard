-- Force update ALL tasks to sync progress_percentage with status
-- This version updates even if progress_percentage is already set

UPDATE tasks
SET progress_percentage = CASE
  WHEN status = 'Done' THEN 100
  WHEN status = 'In progress' THEN 50
  WHEN status = 'Not started' THEN 0
  ELSE 0
END;

-- Verify the update
SELECT description, status, progress_percentage
FROM tasks
ORDER BY status DESC
LIMIT 20;
