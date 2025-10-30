-- Check S4 Follow Ups tasks to see parent and children
SELECT
  id,
  task_name,
  recurring_type,
  recurring_parent_id,
  is_recurring_template,
  created_at
FROM tasks
WHERE task_name LIKE 'S4 Follow Ups%'
ORDER BY created_at DESC;
