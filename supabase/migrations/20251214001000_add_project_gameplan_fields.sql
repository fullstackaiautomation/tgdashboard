-- Add Project Gameplan Detail fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_goal TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_automations TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_start_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_estimated_completion TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_completion_date TIMESTAMPTZ;

-- Add indexes for date-based queries
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(project_start_date);
CREATE INDEX IF NOT EXISTS idx_projects_estimated_completion ON projects(project_estimated_completion);
CREATE INDEX IF NOT EXISTS idx_projects_completion_date ON projects(project_completion_date);
