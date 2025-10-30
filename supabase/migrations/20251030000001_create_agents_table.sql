-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own agents
CREATE POLICY "Users can view their own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own agents
CREATE POLICY "Users can create their own agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own agents
CREATE POLICY "Users can update their own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own agents
CREATE POLICY "Users can delete their own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_agents_user_id ON agents(user_id);
