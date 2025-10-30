-- Verification Queries for Schedule Migration (Story 6.1)
-- Run these queries after migration to verify data integrity

-- =============================================================================
-- 1. SUMMARY COUNTS
-- =============================================================================

SELECT
  'Tasks with scheduled_date' AS metric,
  COUNT(*) AS count
FROM tasks
WHERE scheduled_date IS NOT NULL

UNION ALL

SELECT
  'Time blocks total' AS metric,
  COUNT(*) AS count
FROM task_time_blocks

UNION ALL

SELECT
  'Time blocks (migrated)' AS metric,
  COUNT(*) AS count
FROM task_time_blocks
WHERE notes = 'Migrated from tasks.scheduled_date/scheduled_time';

-- =============================================================================
-- 2. CHECK FOR ORPHANED TIME BLOCKS
-- =============================================================================

-- Should return 0 rows
SELECT
  ttb.id AS block_id,
  ttb.task_id,
  ttb.scheduled_date,
  'ORPHANED: Task does not exist' AS issue
FROM task_time_blocks ttb
LEFT JOIN tasks t ON ttb.task_id = t.id
WHERE t.id IS NULL;

-- =============================================================================
-- 3. CHECK FOR MISSED TASKS
-- =============================================================================

-- Should return 0 rows (tasks with scheduled_date but no time block)
SELECT
  t.id AS task_id,
  t.task_name,
  t.scheduled_date,
  t.scheduled_time,
  'MISSED: No time block created' AS issue
FROM tasks t
WHERE t.scheduled_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM task_time_blocks ttb
    WHERE ttb.task_id = t.id
      AND ttb.scheduled_date = t.scheduled_date::DATE
  );

-- =============================================================================
-- 4. CHECK FOR INVALID TIME RANGES
-- =============================================================================

-- Should return 0 rows (all time blocks should have end_time > start_time)
SELECT
  ttb.id AS block_id,
  ttb.task_id,
  t.task_name,
  ttb.start_time,
  ttb.end_time,
  'INVALID: end_time <= start_time' AS issue
FROM task_time_blocks ttb
JOIN tasks t ON ttb.task_id = t.id
WHERE ttb.end_time <= ttb.start_time;

-- =============================================================================
-- 5. CHECK FOR DUPLICATE TIME BLOCKS
-- =============================================================================

-- Should return 0 rows (no task should have multiple blocks for same date)
SELECT
  ttb.task_id,
  t.task_name,
  ttb.scheduled_date,
  COUNT(*) AS block_count,
  'DUPLICATE: Multiple blocks for same date' AS issue
FROM task_time_blocks ttb
JOIN tasks t ON ttb.task_id = t.id
GROUP BY ttb.task_id, t.task_name, ttb.scheduled_date
HAVING COUNT(*) > 1;

-- =============================================================================
-- 6. CHECK DEFAULT VALUES APPLIED CORRECTLY
-- =============================================================================

-- Tasks with NULL scheduled_time should have start_time = 09:00:00
SELECT
  t.id AS task_id,
  t.task_name,
  t.scheduled_time AS original_time,
  ttb.start_time AS migrated_start_time,
  ttb.end_time AS migrated_end_time,
  ttb.planned_duration_minutes
FROM tasks t
JOIN task_time_blocks ttb ON ttb.task_id = t.id AND ttb.scheduled_date = t.scheduled_date::DATE
WHERE t.scheduled_date IS NOT NULL
  AND t.scheduled_time IS NULL
  AND ttb.notes = 'Migrated from tasks.scheduled_date/scheduled_time'
ORDER BY t.task_name
LIMIT 10;

-- =============================================================================
-- 7. SAMPLE MIGRATED DATA
-- =============================================================================

-- Show sample of migrated data for manual inspection
SELECT
  t.task_name,
  t.scheduled_date AS original_date,
  t.scheduled_time AS original_time,
  ttb.scheduled_date AS block_date,
  ttb.start_time AS block_start,
  ttb.end_time AS block_end,
  ttb.planned_duration_minutes AS duration_mins,
  ttb.status
FROM tasks t
JOIN task_time_blocks ttb ON ttb.task_id = t.id AND ttb.scheduled_date = t.scheduled_date::DATE
WHERE ttb.notes = 'Migrated from tasks.scheduled_date/scheduled_time'
ORDER BY ttb.scheduled_date, ttb.start_time
LIMIT 20;

-- =============================================================================
-- 8. TIMEZONE CHECK
-- =============================================================================

-- Verify dates are stored correctly (no timezone conversion issues)
SELECT
  t.id,
  t.task_name,
  t.scheduled_date,
  ttb.scheduled_date,
  CASE
    WHEN t.scheduled_date::DATE = ttb.scheduled_date THEN '✓ Match'
    ELSE '✗ MISMATCH'
  END AS date_integrity
FROM tasks t
JOIN task_time_blocks ttb ON ttb.task_id = t.id
WHERE t.scheduled_date IS NOT NULL
  AND ttb.notes = 'Migrated from tasks.scheduled_date/scheduled_time'
  AND t.scheduled_date::DATE != ttb.scheduled_date;
-- Should return 0 rows

-- =============================================================================
-- 9. FINAL SUMMARY
-- =============================================================================

SELECT
  '✅ MIGRATION VERIFICATION COMPLETE' AS status,
  NOW() AS verified_at;

-- If all checks above return 0 rows (except summary and samples),
-- the migration was successful!