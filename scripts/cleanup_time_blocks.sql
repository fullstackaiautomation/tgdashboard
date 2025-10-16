-- Script to investigate and clean up migrated time blocks
-- Run this in the Supabase SQL Editor

-- =============================================================================
-- STEP 1: INVESTIGATE - Show all migrated time blocks
-- =============================================================================
-- Run this first to see what time blocks were auto-created from migration

SELECT
  ttb.id AS block_id,
  ttb.scheduled_date,
  ttb.start_time,
  ttb.status,
  t.task_name,
  t.area,
  t.status as task_status,
  ttb.notes,
  ttb.created_at
FROM task_time_blocks ttb
JOIN tasks t ON ttb.task_id = t.id
WHERE ttb.notes LIKE '%Migrated from%'
ORDER BY ttb.scheduled_date DESC, ttb.start_time;

-- Count summary
SELECT
  COUNT(*) as total_migrated_blocks,
  COUNT(DISTINCT task_id) as unique_tasks_with_blocks,
  MIN(scheduled_date) as earliest_date,
  MAX(scheduled_date) as latest_date
FROM task_time_blocks
WHERE notes LIKE '%Migrated from%';

-- =============================================================================
-- STEP 2: CLEANUP OPTIONS (choose one)
-- =============================================================================

-- OPTION A: Remove ALL migrated time blocks (start fresh with manual scheduling)
-- Uncomment to run:
/*
DELETE FROM task_time_blocks
WHERE notes LIKE '%Migrated from%';
*/

-- OPTION B: Remove only OLD migrated time blocks (keep today and future)
-- Uncomment to run:
/*
DELETE FROM task_time_blocks
WHERE notes LIKE '%Migrated from%'
  AND scheduled_date < CURRENT_DATE;
*/

-- OPTION C: Remove migrated blocks for specific year (e.g., 2024)
-- Uncomment to run:
/*
DELETE FROM task_time_blocks
WHERE notes LIKE '%Migrated from%'
  AND EXTRACT(YEAR FROM scheduled_date) = 2024;
*/

-- OPTION D: Remove migrated blocks older than 30 days
-- Uncomment to run:
/*
DELETE FROM task_time_blocks
WHERE notes LIKE '%Migrated from%'
  AND scheduled_date < CURRENT_DATE - INTERVAL '30 days';
*/

-- =============================================================================
-- STEP 3: VERIFY - Check what remains after cleanup
-- =============================================================================
-- Run this after cleanup to verify results

SELECT
  COUNT(*) as remaining_migrated_blocks
FROM task_time_blocks
WHERE notes LIKE '%Migrated from%';

-- Show remaining blocks (if any)
SELECT
  ttb.scheduled_date,
  ttb.start_time,
  t.task_name
FROM task_time_blocks ttb
JOIN tasks t ON ttb.task_id = t.id
WHERE ttb.notes LIKE '%Migrated from%'
ORDER BY ttb.scheduled_date DESC, ttb.start_time
LIMIT 20;
