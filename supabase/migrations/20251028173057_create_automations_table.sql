-- Create automations table for tracking automations across projects
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Core fields
  name TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('Sales', 'Data', 'Fulfillment', 'Marketing', 'Admin')),
  area TEXT NOT NULL CHECK (area IN ('Full Stack', 'Huge Capital', 'S4', '808', 'Personal', 'Health', 'Golf')),
  label TEXT NOT NULL CHECK (label IN ('MCP', 'Skills', 'Agents', 'Workflow')),
  platform TEXT NOT NULL CHECK (platform IN ('n8n', 'Zapier', 'Claude Web', 'Claude Code')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('Auto', 'Manual')),

  -- Multi-select integrations
  integrations TEXT[] DEFAULT '{}',

  -- Status tracking
  completion_level TEXT NOT NULL DEFAULT 'Future Idea' CHECK (completion_level IN ('Future Idea', 'Planning', 'In Progress', 'Review', 'Completed')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),

  -- Dates
  creation_date TIMESTAMPTZ DEFAULT NOW(),
  go_live_date DATE,
  last_checked_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_automation_name UNIQUE(user_id, name)
);

-- Create indexes for common queries
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_project_id ON automations(project_id);
CREATE INDEX idx_automations_area ON automations(area);
CREATE INDEX idx_automations_completion_level ON automations(completion_level);
CREATE INDEX idx_automations_user_area ON automations(user_id, area);

-- Enable RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY automations_select_policy
  ON automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY automations_insert_policy
  ON automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY automations_update_policy
  ON automations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY automations_delete_policy
  ON automations FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automations_updated_at_trigger
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION update_automations_updated_at();