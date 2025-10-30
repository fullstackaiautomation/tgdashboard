-- Area Visions Table
-- Stores the overarching vision/description for each area
-- This is separate from goals and serves as the primary vision statement

CREATE TABLE IF NOT EXISTS area_visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Health', 'Relationships', 'Finance', 'Full Stack', 'Huge Capital', 'S4')),
  vision_statement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_area_visions_user_id ON area_visions(user_id);
CREATE INDEX IF NOT EXISTS idx_area_visions_user_area ON area_visions(user_id, area);

-- RLS Policies
ALTER TABLE area_visions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own area visions" ON area_visions;
CREATE POLICY "Users can manage their own area visions"
  ON area_visions FOR ALL
  USING (auth.uid() = user_id);
