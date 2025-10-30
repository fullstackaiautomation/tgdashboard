-- Debug script to check FAKE TASK 3
-- Run this in Supabase SQL Editor

SELECT
  task_name,
  area,
  due_date,
  scheduled_date,
  business_id,
  created_at
FROM tasks
WHERE task_name LIKE '%FAKE TASK%'
ORDER BY created_at DESC
LIMIT 10;
