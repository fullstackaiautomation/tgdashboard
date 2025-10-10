-- ================================================================
-- Content Library Enhancement Migration
-- PRD: Content Library with AI Summary & Dashboard Areas
-- Stories: CL-1.1 through CL-1.10
-- ================================================================

-- This migration adds:
-- 1. Dashboard Areas column (Story CL-1.1)
-- 2. AI Summary field (Story CL-1.3)
-- 3. Value Rating field (Story CL-1.2)

-- ----------------------------------------------------------------
-- Story CL-1.1: Dashboard Areas Multi-Select
-- ----------------------------------------------------------------
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


-- ----------------------------------------------------------------
-- Stories CL-1.2, CL-1.3: AI Summary and Value Rating
-- ----------------------------------------------------------------
-- Add ai_summary column for AI-generated content summaries
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add value_rating column for 1-10 quality rating
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 10);

-- Add index for value_rating for filtering/sorting performance
CREATE INDEX IF NOT EXISTS idx_content_library_value_rating
ON content_library (value_rating DESC NULLS LAST);

-- Add comments to document the columns
COMMENT ON COLUMN content_library.ai_summary IS
'AI-generated summary of the content (2-3 sentences). Auto-populated by AI analysis or manually entered.';

COMMENT ON COLUMN content_library.value_rating IS
'User-assigned quality rating from 1-10. Set after reviewing content to indicate its value and usefulness.';


-- ================================================================
-- Verification Queries
-- ================================================================

-- Verify columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content_library'
  AND column_name IN ('dashboard_areas', 'ai_summary', 'value_rating')
ORDER BY column_name;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'content_library'
  AND indexname IN ('idx_content_library_dashboard_areas', 'idx_content_library_value_rating');

-- Sample query to test new fields
-- SELECT
--   title,
--   dashboard_areas,
--   ai_summary,
--   value_rating
-- FROM content_library
-- WHERE user_id = 'YOUR_USER_ID'
-- ORDER BY value_rating DESC NULLS LAST
-- LIMIT 10;
