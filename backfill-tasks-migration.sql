-- Backfill migration script for existing tasks
-- This script ensures all existing tasks have proper business_id, project_id, phase_id relationships
-- Run this in Supabase SQL Editor after Story 1.2 implementation

-- Step 1: Check for tasks without proper foreign key relationships
SELECT
  id,
  task_name,
  area,
  business_id,
  project_id,
  phase_id,
  life_area_id
FROM tasks
WHERE (business_id IS NULL AND project_id IS NULL AND phase_id IS NULL AND life_area_id IS NULL)
  AND area IS NOT NULL
ORDER BY created_at DESC;

-- Step 2: Verify no orphaned tasks exist (tasks with invalid foreign keys)
-- Check for tasks with business_id that doesn't exist in businesses table
SELECT
  t.id,
  t.task_name,
  t.business_id
FROM tasks t
WHERE t.business_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM businesses b
    WHERE b.id = t.business_id
  );

-- Check for tasks with project_id that doesn't exist in projects table
SELECT
  t.id,
  t.task_name,
  t.project_id
FROM tasks t
WHERE t.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = t.project_id
  );

-- Check for tasks with phase_id that doesn't exist in phases table
SELECT
  t.id,
  t.task_name,
  t.phase_id
FROM tasks t
WHERE t.phase_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM phases ph
    WHERE ph.id = t.phase_id
  );

-- Check for tasks with life_area_id that doesn't exist in life_areas table
SELECT
  t.id,
  t.task_name,
  t.life_area_id
FROM tasks t
WHERE t.life_area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM life_areas la
    WHERE la.id = t.life_area_id
  );

-- Step 3: Summary report
SELECT
  'Total Tasks' as metric,
  COUNT(*) as count
FROM tasks
UNION ALL
SELECT
  'Tasks with Business' as metric,
  COUNT(*) as count
FROM tasks
WHERE business_id IS NOT NULL
UNION ALL
SELECT
  'Tasks with Project' as metric,
  COUNT(*) as count
FROM tasks
WHERE project_id IS NOT NULL
UNION ALL
SELECT
  'Tasks with Phase' as metric,
  COUNT(*) as count
FROM tasks
WHERE phase_id IS NOT NULL
UNION ALL
SELECT
  'Tasks with Life Area' as metric,
  COUNT(*) as count
FROM tasks
WHERE life_area_id IS NOT NULL
UNION ALL
SELECT
  'Orphaned Tasks (no relationships)' as metric,
  COUNT(*) as count
FROM tasks
WHERE business_id IS NULL
  AND project_id IS NULL
  AND phase_id IS NULL
  AND life_area_id IS NULL;

-- Step 4: (OPTIONAL) If you need to clean up orphaned tasks with broken foreign keys:
-- UNCOMMENT THE FOLLOWING QUERIES ONLY IF YOU HAVE ORPHANED TASKS

-- Delete tasks with invalid business_id
/*
DELETE FROM tasks
WHERE business_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM businesses b
    WHERE b.id = business_id
  );
*/

-- Delete tasks with invalid project_id
/*
DELETE FROM tasks
WHERE project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = project_id
  );
*/

-- Delete tasks with invalid phase_id
/*
DELETE FROM tasks
WHERE phase_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM phases ph
    WHERE ph.id = phase_id
  );
*/

-- Delete tasks with invalid life_area_id
/*
DELETE FROM tasks
WHERE life_area_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM life_areas la
    WHERE la.id = life_area_id
  );
*/
