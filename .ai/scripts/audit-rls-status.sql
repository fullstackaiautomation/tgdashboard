-- RLS Status Audit Script
-- Run this in Supabase SQL Editor to check current RLS policies
-- Date: 2025-10-13

-- ===================================================================
-- PART 1: Check which tables have RLS enabled
-- ===================================================================
SELECT
  tablename AS "Table Name",
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks', 'projects', 'phases', 'businesses',
    'daily_pages', 'deep_work_sessions', 'health_goals',
    'content_items', 'finance_accounts', 'balance_snapshots',
    'life_items', 'golf_scores'
  )
ORDER BY tablename;

-- ===================================================================
-- PART 2: Count policies per table (should be 4 per table)
-- ===================================================================
SELECT
  tablename AS "Table Name",
  COUNT(*) AS "Policy Count",
  CASE
    WHEN COUNT(*) = 4 THEN '✅ COMPLETE'
    WHEN COUNT(*) > 0 THEN '⚠️  PARTIAL'
    ELSE '❌ MISSING'
  END AS "Status"
FROM pg_policies
WHERE tablename IN (
  'tasks', 'projects', 'phases', 'businesses',
  'daily_pages', 'deep_work_sessions', 'health_goals',
  'content_items', 'finance_accounts', 'balance_snapshots',
  'life_items', 'golf_scores'
)
GROUP BY tablename
ORDER BY tablename;

-- ===================================================================
-- PART 3: List all existing policies with details
-- ===================================================================
SELECT
  tablename AS "Table",
  policyname AS "Policy Name",
  cmd AS "Operation",
  CASE
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE '(none)'
  END AS "USING Clause",
  CASE
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE '(none)'
  END AS "WITH CHECK Clause"
FROM pg_policies
WHERE tablename IN (
  'tasks', 'projects', 'phases', 'businesses',
  'daily_pages', 'deep_work_sessions', 'health_goals',
  'content_items', 'finance_accounts', 'balance_snapshots',
  'life_items', 'golf_scores'
)
ORDER BY tablename, cmd;

-- ===================================================================
-- PART 4: Check for tables missing user_id column
-- ===================================================================
SELECT
  t.tablename AS "Table Name",
  CASE
    WHEN c.column_name IS NOT NULL THEN '✅ HAS user_id'
    ELSE '❌ MISSING user_id'
  END AS "Status"
FROM pg_tables t
LEFT JOIN information_schema.columns c
  ON t.tablename = c.table_name
  AND c.column_name = 'user_id'
  AND c.table_schema = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'tasks', 'projects', 'phases', 'businesses',
    'daily_pages', 'deep_work_sessions', 'health_goals',
    'content_items', 'finance_accounts', 'balance_snapshots',
    'life_items', 'golf_scores'
  )
ORDER BY t.tablename;

-- ===================================================================
-- PART 5: Summary - Tables that need RLS work
-- ===================================================================
SELECT
  t.tablename AS "Table Name",
  CASE
    WHEN t.rowsecurity THEN '✅'
    ELSE '❌'
  END AS "RLS",
  COALESCE(p.policy_count, 0) AS "Policies",
  CASE
    WHEN NOT t.rowsecurity THEN '❌ Enable RLS first'
    WHEN COALESCE(p.policy_count, 0) = 0 THEN '❌ Need all 4 policies'
    WHEN p.policy_count < 4 THEN '⚠️  Need ' || (4 - p.policy_count)::text || ' more policies'
    WHEN p.policy_count = 4 THEN '✅ Complete'
    ELSE '⚠️  Too many policies (' || p.policy_count::text || ')'
  END AS "Action Required"
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'tasks', 'projects', 'phases', 'businesses',
    'daily_pages', 'deep_work_sessions', 'health_goals',
    'content_items', 'finance_accounts', 'balance_snapshots',
    'life_items', 'golf_scores'
  )
ORDER BY
  CASE
    WHEN NOT t.rowsecurity THEN 1
    WHEN COALESCE(p.policy_count, 0) = 0 THEN 2
    WHEN p.policy_count < 4 THEN 3
    WHEN p.policy_count = 4 THEN 4
    ELSE 5
  END,
  t.tablename;
