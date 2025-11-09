-- Drop unused columns from tasks table
-- Columns removed: life_area_id, scheduled_start, scheduled_end,
--                  recurring_days, last_recurring_date, original_recurring_task_id

ALTER TABLE tasks
  DROP COLUMN IF EXISTS life_area_id,
  DROP COLUMN IF EXISTS scheduled_start,
  DROP COLUMN IF EXISTS scheduled_end,
  DROP COLUMN IF EXISTS recurring_days,
  DROP COLUMN IF EXISTS last_recurring_date,
  DROP COLUMN IF EXISTS original_recurring_task_id;
