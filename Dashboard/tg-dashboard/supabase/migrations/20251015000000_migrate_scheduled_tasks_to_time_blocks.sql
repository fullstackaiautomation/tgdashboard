-- Migration: Migrate Scheduled Tasks to Time Blocks
-- Story: 6.1 - Data Migration - Scheduled Tasks to Time Blocks
-- Epic: 6 - Master Calendar & Daily Schedule Synchronization
--
-- Purpose: Migrate all existing scheduled task data from tasks table
--          (scheduled_date, scheduled_time) to task_time_blocks table
--          to enable unified scheduling system.
--
-- Safety: This migration is idempotent and preserves original data.
--         Original scheduled_date and scheduled_time columns remain unchanged.
--
-- Rollback: See rollback procedure at end of file

-- =============================================================================
-- PRE-MIGRATION ANALYSIS
-- =============================================================================

-- Show tasks to be migrated (for manual review)
DO $$
DECLARE
  v_task_count INTEGER;
  v_existing_blocks INTEGER;
BEGIN
  -- Count tasks with scheduled data
  SELECT COUNT(*) INTO v_task_count
  FROM tasks
  WHERE scheduled_date IS NOT NULL;

  -- Count existing time blocks (should be 0 on first run)
  SELECT COUNT(*) INTO v_existing_blocks
  FROM task_time_blocks;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRE-MIGRATION ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tasks with scheduled_date: %', v_task_count;
  RAISE NOTICE 'Existing time blocks: %', v_existing_blocks;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Show sample tasks to be migrated
  IF v_task_count > 0 THEN
    RAISE NOTICE 'Sample tasks to migrate:';
    DECLARE
      rec RECORD;
    BEGIN
      FOR rec IN (
        SELECT
          t.id,
          t.task_name,
          t.scheduled_date,
          t.scheduled_time,
          t.user_id,
          CASE
            WHEN t.scheduled_time IS NULL THEN '09:00:00'
            ELSE t.scheduled_time::TEXT
          END AS resolved_start_time
        FROM tasks t
        WHERE t.scheduled_date IS NOT NULL
        ORDER BY t.scheduled_date
        LIMIT 5
      )
      LOOP
        RAISE NOTICE '  - [%] % (Date: %, Time: %, Resolved: %)',
          rec.id, rec.task_name, rec.scheduled_date, COALESCE(rec.scheduled_time::TEXT, '(null)'), rec.resolved_start_time;
      END LOOP;
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION: Insert scheduled tasks into task_time_blocks
-- =============================================================================

-- Begin migration transaction
BEGIN;

-- Store migration start time for rollback purposes
CREATE TEMP TABLE migration_metadata (
  migration_name TEXT,
  start_time TIMESTAMPTZ,
  task_count INTEGER
);

INSERT INTO migration_metadata VALUES (
  'migrate_scheduled_tasks_to_time_blocks',
  NOW(),
  (SELECT COUNT(*) FROM tasks WHERE scheduled_date IS NOT NULL)
);

-- Migrate scheduled tasks to time blocks
INSERT INTO task_time_blocks (
  user_id,
  task_id,
  scheduled_date,
  start_time,
  end_time,
  planned_duration_minutes,
  status,
  notes,
  created_at,
  updated_at
)
SELECT
  t.user_id,
  t.id AS task_id,
  t.scheduled_date::DATE AS scheduled_date,
  -- Use scheduled_time if present, otherwise default to 09:00:00
  COALESCE(
    CASE
      -- Handle HH:MM format (add :00 for seconds)
      WHEN t.scheduled_time::TEXT ~ '^\d{1,2}:\d{2}$' THEN (t.scheduled_time || ':00')::TIME
      -- Handle HH:MM:SS format (use as-is)
      WHEN t.scheduled_time::TEXT ~ '^\d{1,2}:\d{2}:\d{2}$' THEN t.scheduled_time::TIME
      -- Invalid format or NULL - default to 09:00
      ELSE '09:00:00'::TIME
    END,
    '09:00:00'::TIME
  ) AS start_time,
  -- Calculate end_time as start_time + 1 hour
  (COALESCE(
    CASE
      WHEN t.scheduled_time::TEXT ~ '^\d{1,2}:\d{2}$' THEN (t.scheduled_time || ':00')::TIME
      WHEN t.scheduled_time::TEXT ~ '^\d{1,2}:\d{2}:\d{2}$' THEN t.scheduled_time::TIME
      ELSE '09:00:00'::TIME
    END,
    '09:00:00'::TIME
  ) + INTERVAL '1 hour')::TIME AS end_time,
  -- Default duration: 60 minutes (1 hour)
  60 AS planned_duration_minutes,
  -- Default status: scheduled
  'scheduled' AS status,
  -- Add note indicating this was migrated
  'Migrated from tasks.scheduled_date/scheduled_time' AS notes,
  -- Timestamp for tracking
  NOW() AS created_at,
  NOW() AS updated_at
FROM tasks t
WHERE t.scheduled_date IS NOT NULL
  -- Prevent duplicates if migration is re-run
  AND NOT EXISTS (
    SELECT 1
    FROM task_time_blocks ttb
    WHERE ttb.task_id = t.id
      AND ttb.scheduled_date = t.scheduled_date::DATE
  );

-- Get insert count
DO $$
DECLARE
  v_inserted_count INTEGER;
  v_expected_count INTEGER;
BEGIN
  -- Get actual inserted count
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- Get expected count from metadata
  SELECT task_count INTO v_expected_count FROM migration_metadata;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Expected to migrate: %', v_expected_count;
  RAISE NOTICE 'Actually inserted: %', v_inserted_count;
  RAISE NOTICE '========================================';

  IF v_inserted_count < v_expected_count THEN
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: Inserted count is less than expected.';
    RAISE NOTICE 'This may indicate:';
    RAISE NOTICE '  - Migration has been run before (duplicates prevented)';
    RAISE NOTICE '  - Some tasks already have time blocks';
    RAISE NOTICE '  - Invalid data in scheduled_time field';
    RAISE NOTICE '';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Commit transaction
COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================

-- Verify data integrity
DO $$
DECLARE
  v_tasks_with_schedule INTEGER;
  v_time_blocks_count INTEGER;
  v_orphaned_blocks INTEGER;
  v_missed_tasks INTEGER;
BEGIN
  -- Count tasks with scheduled data
  SELECT COUNT(*) INTO v_tasks_with_schedule
  FROM tasks
  WHERE scheduled_date IS NOT NULL;

  -- Count time blocks (including pre-existing ones)
  SELECT COUNT(*) INTO v_time_blocks_count
  FROM task_time_blocks;

  -- Check for orphaned time blocks (shouldn't happen)
  SELECT COUNT(*) INTO v_orphaned_blocks
  FROM task_time_blocks ttb
  LEFT JOIN tasks t ON ttb.task_id = t.id
  WHERE t.id IS NULL;

  -- Check for missed tasks
  SELECT COUNT(*) INTO v_missed_tasks
  FROM tasks t
  WHERE t.scheduled_date IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM task_time_blocks ttb
      WHERE ttb.task_id = t.id
        AND ttb.scheduled_date = t.scheduled_date::DATE
    );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'POST-MIGRATION VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tasks with scheduled_date: %', v_tasks_with_schedule;
  RAISE NOTICE 'Total time blocks: %', v_time_blocks_count;
  RAISE NOTICE 'Orphaned blocks (should be 0): %', v_orphaned_blocks;
  RAISE NOTICE 'Missed tasks (should be 0): %', v_missed_tasks;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Show any missed tasks
  IF v_missed_tasks > 0 THEN
    RAISE NOTICE 'MISSED TASKS (need manual investigation):';
    DECLARE
      rec RECORD;
    BEGIN
      FOR rec IN (
        SELECT t.id, t.task_name, t.scheduled_date, t.scheduled_time
        FROM tasks t
        WHERE t.scheduled_date IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM task_time_blocks ttb
            WHERE ttb.task_id = t.id
              AND ttb.scheduled_date = t.scheduled_date::DATE
          )
        LIMIT 10
      )
      LOOP
        RAISE NOTICE '  - [%] % (Date: %, Time: %)',
          rec.id, rec.task_name, rec.scheduled_date, COALESCE(rec.scheduled_time::TEXT, '(null)');
      END LOOP;
    END;
  END IF;

  -- Show any orphaned blocks
  IF v_orphaned_blocks > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: Found % orphaned time blocks!', v_orphaned_blocks;
    RAISE NOTICE 'This should not happen. Manual investigation required.';
  END IF;

  -- Final status
  IF v_orphaned_blocks = 0 AND v_missed_tasks = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL - All checks passed!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  MIGRATION COMPLETED WITH WARNINGS - Manual review required.';
  END IF;
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- =============================================================================
-- To rollback this migration, run the following commands:
--
-- BEGIN;
--
-- -- Delete all migrated time blocks (identified by notes field)
-- DELETE FROM task_time_blocks
-- WHERE notes = 'Migrated from tasks.scheduled_date/scheduled_time';
--
-- -- Verify deletion
-- SELECT COUNT(*) as remaining_migrated_blocks
-- FROM task_time_blocks
-- WHERE notes = 'Migrated from tasks.scheduled_date/scheduled_time';
-- -- Should return 0
--
-- COMMIT;
--
-- Note: Original scheduled_date and scheduled_time data remains intact
--       in the tasks table, so migration can be re-run after rollback.
-- =============================================================================

-- Add comment to task_time_blocks table documenting migration
COMMENT ON TABLE task_time_blocks IS
'Time blocks for scheduled tasks. Unified scheduling system for Master Calendar and Daily Schedule.
Migration from tasks.scheduled_date/scheduled_time completed on 2025-10-15.';