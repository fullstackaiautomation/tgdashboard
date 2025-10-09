-- Add AI summary and value rating fields to content_library table
-- Part of Content Library Enhancement Epic - Stories 1.2, 1.3

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
