-- Remove project_id from automations table and rename label to type
ALTER TABLE automations DROP COLUMN IF EXISTS project_id;

-- Rename label column to type if it exists
ALTER TABLE automations RENAME COLUMN label TO type;

-- Update constraint description to reflect the change
COMMENT ON COLUMN automations.type IS 'Type of automation: MCP, Skills, Agents, Workflow';
