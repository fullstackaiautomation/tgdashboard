-- Add notes field to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for clarity
COMMENT ON COLUMN projects.notes IS 'Detailed notes about what needs to happen in this project to reach completion';