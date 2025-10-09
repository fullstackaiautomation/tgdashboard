-- Add dashboard_areas column to content_library table
-- This column stores an array of dashboard area IDs (business UUIDs or life area strings)

ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS dashboard_areas TEXT[];

-- Add index for dashboard_areas for filtering performance
CREATE INDEX IF NOT EXISTS idx_content_library_dashboard_areas
ON content_library USING GIN (dashboard_areas);

-- Add comment to document the column
COMMENT ON COLUMN content_library.dashboard_areas IS
'Array of dashboard area identifiers. Can contain business UUIDs from businesses table or life area strings (Health, Finance, Life, Golf)';
