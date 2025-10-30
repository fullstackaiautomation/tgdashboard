-- Story 4.1: Add simple 'area' column to deep_work_sessions
-- User wants simple string area instead of business_id/life_area_id foreign keys

ALTER TABLE deep_work_sessions
ADD COLUMN IF NOT EXISTS area TEXT;

-- Create index on area for filtering
CREATE INDEX IF NOT EXISTS idx_deep_work_area ON deep_work_sessions(area);

-- Add comment
COMMENT ON COLUMN deep_work_sessions.area IS 'Life area as simple string (Full Stack, S4, 808, Personal, Huge Capital, Golf, Health)';

-- Drop the CHECK constraint that required business_id OR life_area_id
ALTER TABLE deep_work_sessions
DROP CONSTRAINT IF EXISTS check_business_or_life_area;

-- Add new CHECK constraint: area OR business_id OR life_area_id can be set
-- This allows backwards compatibility while preferring the simple 'area' column
ALTER TABLE deep_work_sessions
ADD CONSTRAINT check_has_area_info CHECK (
  area IS NOT NULL OR
  business_id IS NOT NULL OR
  life_area_id IS NOT NULL
);
