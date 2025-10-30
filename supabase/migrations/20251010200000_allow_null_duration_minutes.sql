-- Allow null duration_minutes in deep_work_log
-- This is needed because sessions are created when they START (with null duration)
-- and updated with the actual duration when they END

ALTER TABLE deep_work_log
ALTER COLUMN duration_minutes DROP NOT NULL;

-- Add a comment to explain the nullable duration
COMMENT ON COLUMN deep_work_log.duration_minutes IS 'Duration in minutes. NULL for active sessions, set when session completes';
