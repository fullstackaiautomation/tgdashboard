-- Migration: Clean up migrated time blocks (optional)
-- This script helps identify and optionally remove time blocks that were
-- automatically migrated from the old tasks.scheduled_date/scheduled_time fields
-- but are no longer relevant.

-- =============================================================================
-- INVESTIGATION: Show all migrated time blocks
-- =============================================================================

-- Show all time blocks that were created by migration
-- (identified by the notes field containing "Migrated from")
SELECT
  ttb.id AS block_id,
  ttb.scheduled_date,
  ttb.start_time,
  ttb.status,
  t.task_name,
  t.area,
  ttb.notes,
  ttb.created_at
FROM task_time_blocks ttb
JOIN tasks t ON ttb.task_id = t.id
WHERE ttb.notes LIKE '%Migrated from%'
ORDER BY ttb.scheduled_date DESC, ttb.start_time;

-- Count migrated time blocks
SELECT
  COUNT(*) as total_migrated_blocks,
  COUNT(DISTINCT task_id) as unique_tasks_with_blocks
FROM task_time_blocks
WHERE notes LIKE '%Migrated from%';

-- =============================================================================
-- OPTIONAL CLEANUP: Remove all migrated time blocks
-- =============================================================================
-- Uncomment the DELETE statement below if you want to remove all
-- automatically migrated time blocks and start fresh with manual scheduling.
--
-- WARNING: This will remove ALL time blocks that were created by the migration.
-- Only run this if you want to manually re-schedule tasks from scratch.

-- BEGIN;
--
-- DELETE FROM task_time_blocks
-- WHERE notes LIKE '%Migrated from%';
--
-- -- Verify deletion
-- SELECT COUNT(*) as remaining_migrated_blocks
-- FROM task_time_blocks
-- WHERE notes LIKE '%Migrated from%';
-- -- Should return 0
--
-- COMMIT;

-- =============================================================================
-- ALTERNATIVE: Remove only OLD migrated time blocks (before today)
-- =============================================================================
-- This keeps recent/future time blocks but removes old ones that are no longer relevant

-- BEGIN;
--
-- DELETE FROM task_time_blocks
-- WHERE notes LIKE '%Migrated from%'
--   AND scheduled_date < CURRENT_DATE;
--
-- -- Show what remains
-- SELECT
--   COUNT(*) as remaining_migrated_blocks,
--   MIN(scheduled_date) as earliest_date,
--   MAX(scheduled_date) as latest_date
-- FROM task_time_blocks
-- WHERE notes LIKE '%Migrated from%';
--
-- COMMIT;

-- =============================================================================
-- ALTERNATIVE: Remove migrated blocks for specific date range
-- =============================================================================
-- Useful if you want to clean up a specific time period

-- BEGIN;
--
-- DELETE FROM task_time_blocks
-- WHERE notes LIKE '%Migrated from%'
--   AND scheduled_date BETWEEN '2024-01-01' AND '2024-12-31'; -- Adjust dates as needed
--
-- COMMIT;
