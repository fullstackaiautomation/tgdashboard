-- Add automation_ids column to projects table for linking selected automations
ALTER TABLE projects ADD COLUMN IF NOT EXISTS automation_ids UUID[] DEFAULT '{}'::UUID[];

-- Add index for queries on automation_ids
CREATE INDEX IF NOT EXISTS idx_projects_automation_ids ON projects USING GIN(automation_ids);
