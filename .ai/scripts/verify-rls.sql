-- Supabase Row Level Security (RLS) Verification Script
-- Version: 1.0.0
-- Purpose: Verify all tables have RLS enabled with proper policies
-- Usage: Run this query in Supabase SQL Editor

-- Query 1: Check RLS status for all public tables
SELECT
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    (SELECT COUNT(*)
     FROM pg_policies
     WHERE tablename = c.tablename) as policy_count
FROM pg_tables c
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks',
    'projects',
    'phases',
    'businesses',
    'daily_pages',
    'deep_work_sessions',
    'health_goals',
    'content_items',
    'finance_records',
    'finance_accounts',
    'balance_snapshots',
    'life_items',
    'golf_scores'
  )
ORDER BY tablename;

-- Expected Output:
-- All tables should show:
-- - rls_status = '✅ ENABLED'
-- - policy_count >= 1 (at least one policy enforcing user_id = auth.uid())

-- Query 2: List all RLS policies with details
SELECT
    schemaname,
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command,
    CASE qual
        WHEN NULL THEN 'No restriction'
        ELSE 'Has restriction'
    END as has_using_clause,
    CASE with_check
        WHEN NULL THEN 'No check'
        ELSE 'Has check'
    END as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks',
    'projects',
    'phases',
    'businesses',
    'daily_pages',
    'deep_work_sessions',
    'health_goals',
    'content_items',
    'finance_records',
    'finance_accounts',
    'balance_snapshots',
    'life_items',
    'golf_scores'
  )
ORDER BY tablename, policyname;

-- Query 3: Check for tables WITHOUT RLS (security risk!)
SELECT
    tablename as table_without_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks',
    'projects',
    'phases',
    'businesses',
    'daily_pages',
    'deep_work_sessions',
    'health_goals',
    'content_items',
    'finance_records',
    'finance_accounts',
    'balance_snapshots',
    'life_items',
    'golf_scores'
  )
  AND rowsecurity = false;

-- Expected Output: Empty result (no tables without RLS)
-- If any tables appear, RLS must be enabled immediately!

-- Query 4: Verify user_id column exists on all tables
SELECT
    table_name,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = t.table_name
              AND column_name = 'user_id'
        ) THEN '✅ Has user_id'
        ELSE '❌ Missing user_id'
    END as user_id_status
FROM (
    SELECT unnest(ARRAY[
        'tasks',
        'projects',
        'phases',
        'businesses',
        'daily_pages',
        'deep_work_sessions',
        'health_goals',
        'content_items',
        'finance_records',
        'finance_accounts',
        'balance_snapshots',
        'life_items',
        'golf_scores'
    ]) as table_name
) t;

-- Expected Output:
-- All tables should show '✅ Has user_id'
-- user_id column required for RLS policies to filter by auth.uid()

-- PASS CRITERIA SUMMARY:
-- ✅ All tables have rowsecurity = true
-- ✅ All tables have policy_count >= 1
-- ✅ Query 3 returns empty result (no tables without RLS)
-- ✅ All tables have user_id column
-- ❌ Any table failing above criteria blocks deployment

-- REMEDIATION EXAMPLE:
-- If a table is missing RLS, enable it with:
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can only access their own data"
-- ON table_name
-- FOR ALL
-- USING (user_id = auth.uid());
