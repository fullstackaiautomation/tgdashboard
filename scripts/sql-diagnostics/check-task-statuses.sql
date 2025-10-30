-- Check what task statuses exist in the database
SELECT
  status,
  COUNT(*) as task_count
FROM tasks
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
GROUP BY status
ORDER BY task_count DESC;

-- Also show a sample of tasks
SELECT
  id,
  task_name,
  status,
  area,
  hours_projected,
  due_date
FROM tasks
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
ORDER BY created_at DESC
LIMIT 10;
