-- Allow null end_time in deep_work_log
-- This is needed because sessions are created when they START (with null end_time)
-- and updated with the actual end_time when they END

ALTER TABLE deep_work_log
ALTER COLUMN end_time DROP NOT NULL;

-- Add a comment to explain the nullable end_time
COMMENT ON COLUMN deep_work_log.end_time IS 'Session end time. NULL for active sessions, set when session completes';
