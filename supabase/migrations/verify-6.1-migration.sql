-- Quick verification query for Story 6.1 migration
-- Run this in Supabase SQL Editor to see migrated data

-- Show sample migrated time blocks
SELECT
  ttb.id,
  ttb.task_id,
  t.task_name,
  ttb.scheduled_date,
  ttb.start_time,
  ttb.end_time,
  ttb.planned_duration_minutes,
  ttb.status,
  ttb.notes
FROM task_time_blocks ttb
JOIN tasks t ON ttb.task_id = t.id
WHERE ttb.notes = 'Migrated from tasks.scheduled_date/scheduled_time'
ORDER BY ttb.scheduled_date, ttb.start_time
LIMIT 20;

-- Summary counts
SELECT
  'Total migrated blocks' as metric,
  COUNT(*) as count
FROM task_time_blocks
WHERE notes = 'Migrated from tasks.scheduled_date/scheduled_time'

UNION ALL

SELECT
  'Tasks with scheduled_date' as metric,
  COUNT(*) as count
FROM tasks
WHERE scheduled_date IS NOT NULL;
