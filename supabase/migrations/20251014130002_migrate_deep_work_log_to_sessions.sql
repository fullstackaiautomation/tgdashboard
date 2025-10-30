-- Migrate data from old deep_work_log table to new deep_work_sessions table

INSERT INTO deep_work_sessions (
  id,
  user_id,
  area,
  task_type,
  task_id,
  start_time,
  end_time,
  status,
  created_at
)
SELECT
  dwl.id,
  dwl.user_id,
  dwl.area,
  dwl.task_type,
  -- Only set task_id if the task still exists, otherwise NULL
  CASE
    WHEN EXISTS (SELECT 1 FROM tasks WHERE tasks.id = dwl.task_id) THEN dwl.task_id
    ELSE NULL
  END as task_id,
  dwl.start_time,
  dwl.end_time,
  CASE
    WHEN dwl.end_time IS NOT NULL THEN 'completed'
    ELSE 'active'
  END as status,
  dwl.created_at
FROM deep_work_log dwl
WHERE NOT EXISTS (
  -- Don't insert duplicates if this migration runs twice
  SELECT 1 FROM deep_work_sessions WHERE deep_work_sessions.id = dwl.id
);

-- Add comment
COMMENT ON TABLE deep_work_sessions IS 'Deep work sessions - migrated from deep_work_log table';
