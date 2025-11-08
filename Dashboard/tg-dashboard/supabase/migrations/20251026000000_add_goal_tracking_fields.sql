-- Add tracking fields to goals table
-- For storing started metric value, check-in value, and check-in date

ALTER TABLE goals ADD COLUMN IF NOT EXISTS started_metric_value VARCHAR;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS check_in_value VARCHAR;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS check_in_date DATE;
