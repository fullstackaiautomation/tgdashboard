-- RLS Policy Testing Script
-- Run this in Supabase SQL Editor to test RLS policies
-- Date: 2025-10-13
--
-- IMPORTANT: This script tests RLS by attempting to access data across users
-- All cross-user access attempts should FAIL (return 0 rows)

-- =============================================================================
-- TEST SETUP: Current user info
-- =============================================================================
SELECT
  'Current authenticated user' as test,
  auth.uid() as user_id,
  auth.role() as role;

-- =============================================================================
-- TEST 1: Verify RLS is enabled on all tables
-- =============================================================================
SELECT
  '=== TEST 1: RLS Enabled Check ===' as test_name;

SELECT
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ PASS'
    ELSE '❌ FAIL - RLS not enabled'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tasks', 'projects', 'phases', 'businesses',
    'deep_work_sessions', 'notes',
    'accounts', 'balance_snapshots',
    'content_items', 'daily_pages', 'health_goals',
    'life_items', 'golf_scores'
  )
ORDER BY tablename;

-- =============================================================================
-- TEST 2: Verify all tables have 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- =============================================================================
SELECT
  '=== TEST 2: Policy Count Check ===' as test_name;

SELECT
  tablename,
  COUNT(*) as policy_count,
  CASE
    WHEN COUNT(*) = 4 THEN '✅ PASS - All 4 policies exist'
    WHEN COUNT(*) < 4 THEN '❌ FAIL - Missing ' || (4 - COUNT(*))::text || ' policies'
    ELSE '⚠️  WARNING - Extra policies (' || COUNT(*)::text || ' total)'
  END as result
FROM pg_policies
WHERE tablename IN (
  'tasks', 'projects', 'phases', 'businesses',
  'deep_work_sessions', 'notes',
  'accounts', 'balance_snapshots',
  'content_items', 'daily_pages', 'health_goals',
  'life_items', 'golf_scores'
)
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- TEST 3: Verify no insecure policies using USING (true)
-- =============================================================================
SELECT
  '=== TEST 3: Insecure Policy Check ===' as test_name;

SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check,
  '❌ FAIL - Insecure policy allows all authenticated users' as result
FROM pg_policies
WHERE tablename IN (
  'tasks', 'projects', 'phases', 'businesses',
  'deep_work_sessions', 'notes',
  'accounts', 'balance_snapshots',
  'content_items', 'daily_pages', 'health_goals',
  'life_items', 'golf_scores'
)
AND (qual = 'true' OR with_check = 'true');

-- If no rows returned, test passes
-- Expected: 0 rows (all policies should use auth.uid() = user_id)

SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename IN (
        'tasks', 'projects', 'phases', 'businesses',
        'deep_work_sessions', 'notes',
        'accounts', 'balance_snapshots'
      )
      AND (qual = 'true' OR with_check = 'true')
    )
    THEN '✅ PASS - No insecure policies found'
    ELSE '❌ FAIL - Insecure policies detected above'
  END as overall_result;

-- =============================================================================
-- TEST 4: Verify all policies reference auth.uid()
-- =============================================================================
SELECT
  '=== TEST 4: auth.uid() Usage Check ===' as test_name;

SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN (qual LIKE '%auth.uid()%' OR cmd = 'INSERT') AND
         (with_check LIKE '%auth.uid()%' OR cmd IN ('SELECT', 'DELETE'))
    THEN '✅ PASS'
    ELSE '❌ FAIL - Missing auth.uid() check'
  END as result,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename IN (
  'tasks', 'projects', 'phases', 'businesses',
  'deep_work_sessions', 'notes',
  'accounts', 'balance_snapshots'
)
ORDER BY tablename, cmd;

-- =============================================================================
-- TEST 5: Verify user_id column exists on all tables
-- =============================================================================
SELECT
  '=== TEST 5: user_id Column Check ===' as test_name;

SELECT
  t.tablename,
  CASE
    WHEN c.column_name IS NOT NULL THEN '✅ PASS - user_id exists'
    ELSE '❌ FAIL - user_id column missing'
  END as result,
  c.data_type,
  c.is_nullable
FROM pg_tables t
LEFT JOIN information_schema.columns c
  ON t.tablename = c.table_name
  AND c.column_name = 'user_id'
  AND c.table_schema = 'public'
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'tasks', 'projects', 'phases', 'businesses',
    'deep_work_sessions', 'notes',
    'accounts', 'balance_snapshots',
    'content_items', 'daily_pages', 'health_goals',
    'life_items', 'golf_scores'
  )
ORDER BY t.tablename;

-- =============================================================================
-- TEST 6: Functional RLS test - Check data isolation
-- =============================================================================
SELECT
  '=== TEST 6: Data Isolation Check ===' as test_name;

-- This test verifies you can only see your own data
-- Expected: All counts should match (you can only see your own data)

WITH user_data AS (
  SELECT auth.uid() as current_user_id
)
SELECT
  'tasks' as table_name,
  COUNT(*) as visible_rows,
  COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data)) as my_rows,
  CASE
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data))
    THEN '✅ PASS - Only seeing own data'
    ELSE '❌ FAIL - Seeing other users data'
  END as result
FROM tasks
UNION ALL
SELECT
  'businesses' as table_name,
  COUNT(*) as visible_rows,
  COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data)) as my_rows,
  CASE
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data))
    THEN '✅ PASS - Only seeing own data'
    ELSE '❌ FAIL - Seeing other users data'
  END as result
FROM businesses
UNION ALL
SELECT
  'projects' as table_name,
  COUNT(*) as visible_rows,
  COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data)) as my_rows,
  CASE
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data))
    THEN '✅ PASS - Only seeing own data'
    ELSE '❌ FAIL - Seeing other users data'
  END as result
FROM projects
UNION ALL
SELECT
  'phases' as table_name,
  COUNT(*) as visible_rows,
  COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data)) as my_rows,
  CASE
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE user_id = (SELECT current_user_id FROM user_data))
    THEN '✅ PASS - Only seeing own data'
    ELSE '❌ FAIL - Seeing other users data'
  END as result
FROM phases;

-- =============================================================================
-- TEST 7: Verify service role key not in client code (manual check)
-- =============================================================================
SELECT
  '=== TEST 7: Service Role Key Security ===' as test_name;

SELECT
  'Run this in your terminal:' as instruction,
  'grep -r "SERVICE_ROLE" src/' as command,
  'Expected: No results (service role key should only be in GitHub Secrets)' as expected_result;

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================
SELECT
  '=== RLS POLICY TEST SUMMARY ===' as summary;

SELECT
  'Use the rls_policy_audit view for quick overview:' as instruction;

SELECT * FROM rls_policy_audit;

-- =============================================================================
-- CLEANUP (if testing with test data)
-- =============================================================================
-- If you created test users/data, clean up here
-- DO NOT run this on production data!

-- DELETE FROM tasks WHERE title LIKE '%RLS_TEST%';
-- (etc.)

-- =============================================================================
-- MANUAL CROSS-USER TESTS (requires creating a second test user)
-- =============================================================================

/*
To perform comprehensive cross-user testing:

1. Create a second test user in Supabase Auth:
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user" → Email + Password
   - Email: test2@example.com
   - Password: TestUser123

2. Sign in as your main user (tgrassmick@gmail.com) and create test data:
   INSERT INTO tasks (user_id, title, status)
   VALUES (auth.uid(), 'RLS_TEST_TASK_USER1', 'active');

3. Sign out and sign in as test user 2 (test2@example.com)

4. Attempt to view User 1's task:
   SELECT * FROM tasks WHERE title = 'RLS_TEST_TASK_USER1';
   Expected: 0 rows (RLS blocks access)

5. Attempt to update User 1's task:
   UPDATE tasks SET status = 'completed' WHERE title = 'RLS_TEST_TASK_USER1';
   Expected: 0 rows updated (RLS blocks update)

6. Attempt to insert a task with User 1's ID:
   -- First get User 1's ID: SELECT id FROM auth.users WHERE email = 'tgrassmick@gmail.com';
   INSERT INTO tasks (user_id, title, status)
   VALUES ('<USER_1_ID>', 'HACKED_TASK', 'active');
   Expected: ERROR - new row violates RLS policy (WITH CHECK prevents this)

7. Verify User 2 can create their own tasks:
   INSERT INTO tasks (user_id, title, status)
   VALUES (auth.uid(), 'RLS_TEST_TASK_USER2', 'active');
   Expected: Success (1 row inserted)

8. Verify User 2 can only see their own task:
   SELECT * FROM tasks;
   Expected: Only 'RLS_TEST_TASK_USER2' visible, NOT 'RLS_TEST_TASK_USER1'

9. Clean up test data:
   - Sign in as User 1: DELETE FROM tasks WHERE title = 'RLS_TEST_TASK_USER1';
   - Sign in as User 2: DELETE FROM tasks WHERE title = 'RLS_TEST_TASK_USER2';
   - Delete test user 2 from Supabase Auth
*/
