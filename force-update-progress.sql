-- Disable RLS temporarily to force update
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Update all tasks
UPDATE tasks
SET progress_percentage = CASE
  WHEN status = 'Done' THEN 100
  WHEN status = 'In progress' THEN 50
  WHEN status = 'Not started' THEN 0
  ELSE 0
END;

-- Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Verify the results
SELECT status, progress_percentage, COUNT(*) as count
FROM tasks
GROUP BY status, progress_percentage
ORDER BY status;
