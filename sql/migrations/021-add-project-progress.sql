-- Add progress_percentage column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_progress_percentage_check'
  ) THEN
    ALTER TABLE projects
    ADD CONSTRAINT projects_progress_percentage_check
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
  END IF;
END $$;

-- Verify
SELECT name, progress_percentage
FROM projects
LIMIT 10;
