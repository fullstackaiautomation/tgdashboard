-- Copy all tasks from "TG To Do List" to tasks table
-- This matches the exact column structure from both tables

INSERT INTO tasks (
  id,
  user_id,
  task_name,
  description,
  area,
  task_type,
  status,
  automation,
  priority,
  effort_level,
  due_date,
  completed_at,
  past_due,
  created_at,
  updated_at,
  checklist,
  recurring_type,
  recurring_interval,
  recurring_days,
  last_recurring_date,
  is_recurring_template,
  original_recurring_task_id,
  hours_projected,
  hours_worked,
  scheduled_start,
  scheduled_end
)
SELECT
  id,
  COALESCE(user_id, 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c') as user_id,
  task_name,
  description,
  area,
  task_type,
  status,
  automation,
  priority,
  effort_level,
  due_date,
  completed_at,
  past_due,
  created_at,
  updated_at,
  checklist,
  recurring_type,
  recurring_interval,
  recurring_days,
  last_recurring_date,
  is_recurring_template,
  original_recurring_task_id,
  CASE
    WHEN "Hours Projected" ~ '^[0-9]+\.?[0-9]*$' THEN "Hours Projected"::numeric
    ELSE NULL
  END as hours_projected,
  CASE
    WHEN "Hours Worked" ~ '^[0-9]+\.?[0-9]*$' THEN "Hours Worked"::numeric
    ELSE NULL
  END as hours_worked,
  scheduled_start,
  scheduled_end
FROM "TG To Do List";

-- Verify the copy
SELECT COUNT(*) as total_tasks_copied FROM tasks;
