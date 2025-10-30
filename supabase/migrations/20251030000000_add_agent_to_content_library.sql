-- Add agent column to content_library table
ALTER TABLE content_library
ADD COLUMN agent TEXT DEFAULT NULL;

-- Create index for agent column for faster queries
CREATE INDEX idx_content_library_agent ON content_library(agent);

-- Update RLS policy if needed (assuming existing RLS policies are in place)
-- The agent column should follow the same access control as other content fields
