-- Add google_llm column to content_library table
-- This column represents whether content should be added to Google LLM Notebook
-- NULL = "Should" (undecided), true = "Yes", false = "No" (default)

ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS google_llm BOOLEAN DEFAULT false;

COMMENT ON COLUMN content_library.google_llm IS 'Whether content should be added to Google LLM Notebook: NULL = Should (undecided), true = Yes, false = No (default)';
