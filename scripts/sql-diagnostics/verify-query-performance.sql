-- ============================================================================
-- Story 1.6: Query Performance Verification with EXPLAIN ANALYZE
-- ============================================================================
-- This file contains EXPLAIN ANALYZE queries to verify that database indexes
-- are being used properly and queries meet the <100ms performance target.
--
-- HOW TO USE:
-- 1. Open Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)
-- 2. User ID already set to: cbdd0170-5c6b-429c-9a8f-f3ba4e46405c
-- 3. Run each query one at a time
-- 4. Look for these indicators in the output:
--    ✅ GOOD: "Index Scan" or "Index Only Scan" - means indexes are being used
--    ❌ BAD: "Seq Scan" - means full table scan (slow, needs index)
--    ✅ GOOD: Execution Time < 100ms
--    ⚠️  WARNING: Execution Time > 100ms but < 500ms (acceptable but could optimize)
--    ❌ BAD: Execution Time > 500ms (needs optimization)
--
-- ============================================================================

-- First, let's check what indexes currently exist on the tasks table
-- ============================================================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'tasks'
ORDER BY indexname;

-- Expected indexes:
-- - tasks_pkey (PRIMARY KEY on id)
-- - tasks_user_id_idx (INDEX on user_id)
-- - tasks_business_id_idx (INDEX on business_id)
-- - tasks_due_date_idx (INDEX on due_date)
-- - tasks_status_idx (INDEX on status)
-- - tasks_scheduled_date_idx (INDEX on scheduled_date)
-- - idx_tasks_user_status_date (COMPOSITE INDEX on user_id, status, due_date)

-- ============================================================================
-- Query 1: Fetch All Tasks (Most Common Query)
-- ============================================================================
-- This matches the useTasks() hook query in src/hooks/useTasks.ts:12-21
-- Expected: Should use Index Scan on tasks_user_id_idx
-- Target: < 100ms execution time

EXPLAIN ANALYZE
SELECT
    t.*,
    b.id as business_id, b.name as business_name, b.color as business_color, b.slug as business_slug,
    p.id as project_id, p.name as project_name, p.description as project_description,
    ph.id as phase_id, ph.name as phase_name, ph.description as phase_description,
    l.id as life_area_id, l.name as life_area_name, l.color as life_area_color, l.category as life_area_category
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN phases ph ON t.phase_id = ph.id
LEFT JOIN life_areas l ON t.life_area_id = l.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
ORDER BY t.created_at DESC;

-- ============================================================================
-- Query 2: Fetch Tasks by Business (Business Dashboard)
-- ============================================================================
-- This matches queries used in Business Dashboard filtering
-- Expected: Should use Index Scan on tasks_business_id_idx
-- Target: < 50ms execution time (smaller result set)

EXPLAIN ANALYZE
SELECT
    t.*,
    b.id as business_id, b.name as business_name, b.color as business_color, b.slug as business_slug,
    p.id as project_id, p.name as project_name,
    ph.id as phase_id, ph.name as phase_name
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN phases ph ON t.phase_id = ph.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND t.business_id = (SELECT id FROM businesses WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c' LIMIT 1)
ORDER BY t.created_at DESC;

-- ============================================================================
-- Query 3: Fetch Active Tasks (Status Filtering)
-- ============================================================================
-- This matches TasksHub filtering by status
-- Expected: Should use Bitmap Index Scan on idx_tasks_user_status_date
-- Target: < 100ms execution time

EXPLAIN ANALYZE
SELECT
    t.*,
    b.name as business_name,
    p.name as project_name,
    ph.name as phase_name
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN phases ph ON t.phase_id = ph.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND t.status = 'In progress'
ORDER BY t.due_date ASC NULLS LAST;

-- ============================================================================
-- Query 4: Fetch Tasks by Due Date (Overdue Tasks)
-- ============================================================================
-- This matches Daily Schedule panel query for overdue tasks
-- Expected: Should use Index Scan on tasks_due_date_idx
-- Target: < 50ms execution time

EXPLAIN ANALYZE
SELECT
    t.*,
    b.name as business_name
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND t.status != 'Done'
  AND t.due_date < CURRENT_DATE
ORDER BY t.due_date ASC;

-- ============================================================================
-- Query 5: Fetch Scheduled Tasks for Today (Daily Schedule)
-- ============================================================================
-- This matches the Daily Schedule panel query
-- Expected: Should use Index Scan on tasks_scheduled_date_idx
-- Target: < 50ms execution time

EXPLAIN ANALYZE
SELECT
    t.*,
    b.name as business_name,
    b.slug as business_slug
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND t.scheduled_date = CURRENT_DATE
ORDER BY t.scheduled_time ASC NULLS LAST;

-- ============================================================================
-- Query 6: Fetch Tasks by Project (Business Projects View)
-- ============================================================================
-- This matches the project detail view query
-- Expected: Should use Index Scan on tasks_project_id_idx (if exists)
-- Target: < 30ms execution time (very specific query)

EXPLAIN ANALYZE
SELECT
    t.*,
    ph.name as phase_name
FROM tasks t
LEFT JOIN phases ph ON t.phase_id = ph.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND t.project_id = (SELECT id FROM projects WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c' LIMIT 1)
ORDER BY t.created_at DESC;

-- ============================================================================
-- Query 7: Deep Work Sessions with Task Data
-- ============================================================================
-- This matches the deep work analytics queries
-- Expected: Should use Index Scan on deep_work_sessions user_id index
-- Target: < 100ms execution time

EXPLAIN ANALYZE
SELECT
    dws.*,
    t.task_name,
    t.area,
    b.name as business_name,
    b.slug as business_slug
FROM deep_work_sessions dws
LEFT JOIN tasks t ON dws.task_id = t.id
LEFT JOIN businesses b ON t.business_id = b.id
WHERE dws.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND dws.start_time >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY dws.start_time DESC;

-- ============================================================================
-- Query 8: Single Task Fetch (Task Detail/Update)
-- ============================================================================
-- This matches the conflict detection query in useUpdateTask
-- Expected: Should use Index Scan on tasks_pkey (primary key)
-- Target: < 10ms execution time (single row lookup)

EXPLAIN ANALYZE
SELECT
    t.*,
    b.name as business_name,
    p.name as project_name,
    ph.name as phase_name
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN phases ph ON t.phase_id = ph.id
WHERE t.id = (SELECT id FROM tasks WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c' LIMIT 1);

-- ============================================================================
-- Query 9: Count Tasks by Status (Dashboard Stats)
-- ============================================================================
-- This is used for displaying task counts in various dashboards
-- Expected: Should use Index Scan on idx_tasks_user_status_date
-- Target: < 50ms execution time

EXPLAIN ANALYZE
SELECT
    status,
    COUNT(*) as count
FROM tasks
WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
GROUP BY status;

-- ============================================================================
-- Query 10: Recent Tasks (Last 7 Days)
-- ============================================================================
-- This could be used for "Recently Added" features
-- Expected: Should use Index Scan on tasks_created_at_idx (if exists)
-- Target: < 50ms execution time

EXPLAIN ANALYZE
SELECT
    t.*,
    b.name as business_name
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE t.user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
  AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY t.created_at DESC;

-- ============================================================================
-- PERFORMANCE SUMMARY QUERY
-- ============================================================================
-- This query helps identify slow queries in production
-- Run this to see actual query performance over time

SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%tasks%'
  AND query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- NOTE: pg_stat_statements extension must be enabled for this query to work
-- If you get an error, enable it with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- RECOMMENDATIONS BASED ON RESULTS
-- ============================================================================
-- After running these queries, check for:
--
-- 1. Missing Indexes:
--    If you see "Seq Scan" on tasks table, add index on that column:
--    CREATE INDEX idx_tasks_column_name ON tasks(column_name);
--
-- 2. Unused Indexes:
--    SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
--    Consider dropping unused indexes to improve INSERT/UPDATE performance
--
-- 3. Slow Joins:
--    If LEFT JOINs are slow, ensure foreign key columns have indexes:
--    CREATE INDEX idx_tasks_project_id ON tasks(project_id);
--    CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
--
-- 4. Composite Index Optimization:
--    If queries filter by multiple columns, create composite indexes:
--    CREATE INDEX idx_name ON table(col1, col2, col3);
--    Order matters: most selective column first
--
-- ============================================================================
