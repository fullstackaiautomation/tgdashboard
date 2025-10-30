-- Migration: Add start_time and end_time to task_time_logs
-- Purpose: Track specific start/end times for time log entries

ALTER TABLE task_time_logs
  ADD COLUMN start_time TIME,
  ADD COLUMN end_time TIME;

-- Update existing records to have NULL start/end times (they can be filled in later)
-- No need to do anything since new columns default to NULL

COMMENT ON COLUMN task_time_logs.start_time IS 'Start time for this work session';
COMMENT ON COLUMN task_time_logs.end_time IS 'End time for this work session';
