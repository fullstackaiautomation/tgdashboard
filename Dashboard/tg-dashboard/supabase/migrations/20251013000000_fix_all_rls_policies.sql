-- Fix all RLS policies to properly use auth.uid() = user_id
-- Migration Date: 2025-10-13
-- Story: 3.3 - Supabase Row Level Security Policies
--
-- CRITICAL SECURITY FIX:
-- Previous migration (20251010000000_fix_tasks_rls.sql) used USING (true) which allows
-- ANY authenticated user to access ANY data. This migration fixes that to properly
-- restrict access to user_id = auth.uid().

-- =============================================================================
-- PART 1: Fix INSECURE policies on tasks, businesses, projects, phases
-- =============================================================================

-- ===== TASKS TABLE =====
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create secure policies
CREATE POLICY "tasks_select_policy"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_policy"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_policy"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_policy"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== BUSINESSES TABLE =====
DROP POLICY IF EXISTS "Users can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete businesses" ON businesses;

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_select_policy"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "businesses_insert_policy"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses_update_policy"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "businesses_delete_policy"
  ON businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== PROJECTS TABLE =====
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_policy"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_policy"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_policy"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_policy"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== PHASES TABLE =====
DROP POLICY IF EXISTS "Users can view all phases" ON phases;
DROP POLICY IF EXISTS "Users can insert phases" ON phases;
DROP POLICY IF EXISTS "Users can update phases" ON phases;
DROP POLICY IF EXISTS "Users can delete phases" ON phases;

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phases_select_policy"
  ON phases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "phases_insert_policy"
  ON phases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "phases_update_policy"
  ON phases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "phases_delete_policy"
  ON phases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- PART 2: Add RLS to tables that might be missing it
-- =============================================================================

-- ===== CONTENT_ITEMS TABLE (if exists) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_items') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE content_items ENABLE ROW LEVEL SECURITY';

    -- Drop any existing policies
    DROP POLICY IF EXISTS "content_items_select_policy" ON content_items;
    DROP POLICY IF EXISTS "content_items_insert_policy" ON content_items;
    DROP POLICY IF EXISTS "content_items_update_policy" ON content_items;
    DROP POLICY IF EXISTS "content_items_delete_policy" ON content_items;

    -- Create secure policies
    EXECUTE 'CREATE POLICY "content_items_select_policy" ON content_items FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "content_items_insert_policy" ON content_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "content_items_update_policy" ON content_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "content_items_delete_policy" ON content_items FOR DELETE TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ===== DAILY_PAGES TABLE (if exists) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_pages') THEN
    EXECUTE 'ALTER TABLE daily_pages ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "daily_pages_select_policy" ON daily_pages;
    DROP POLICY IF EXISTS "daily_pages_insert_policy" ON daily_pages;
    DROP POLICY IF EXISTS "daily_pages_update_policy" ON daily_pages;
    DROP POLICY IF EXISTS "daily_pages_delete_policy" ON daily_pages;

    EXECUTE 'CREATE POLICY "daily_pages_select_policy" ON daily_pages FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "daily_pages_insert_policy" ON daily_pages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "daily_pages_update_policy" ON daily_pages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "daily_pages_delete_policy" ON daily_pages FOR DELETE TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ===== HEALTH_GOALS TABLE (if exists) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_goals') THEN
    EXECUTE 'ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "health_goals_select_policy" ON health_goals;
    DROP POLICY IF EXISTS "health_goals_insert_policy" ON health_goals;
    DROP POLICY IF EXISTS "health_goals_update_policy" ON health_goals;
    DROP POLICY IF EXISTS "health_goals_delete_policy" ON health_goals;

    EXECUTE 'CREATE POLICY "health_goals_select_policy" ON health_goals FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "health_goals_insert_policy" ON health_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "health_goals_update_policy" ON health_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "health_goals_delete_policy" ON health_goals FOR DELETE TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ===== LIFE_ITEMS TABLE (if exists) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'life_items') THEN
    EXECUTE 'ALTER TABLE life_items ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "life_items_select_policy" ON life_items;
    DROP POLICY IF EXISTS "life_items_insert_policy" ON life_items;
    DROP POLICY IF EXISTS "life_items_update_policy" ON life_items;
    DROP POLICY IF EXISTS "life_items_delete_policy" ON life_items;

    EXECUTE 'CREATE POLICY "life_items_select_policy" ON life_items FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "life_items_insert_policy" ON life_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "life_items_update_policy" ON life_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "life_items_delete_policy" ON life_items FOR DELETE TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ===== GOLF_SCORES TABLE (if exists) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'golf_scores') THEN
    EXECUTE 'ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY';

    DROP POLICY IF EXISTS "golf_scores_select_policy" ON golf_scores;
    DROP POLICY IF EXISTS "golf_scores_insert_policy" ON golf_scores;
    DROP POLICY IF EXISTS "golf_scores_update_policy" ON golf_scores;
    DROP POLICY IF EXISTS "golf_scores_delete_policy" ON golf_scores;

    EXECUTE 'CREATE POLICY "golf_scores_select_policy" ON golf_scores FOR SELECT TO authenticated USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "golf_scores_insert_policy" ON golf_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "golf_scores_update_policy" ON golf_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "golf_scores_delete_policy" ON golf_scores FOR DELETE TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ===== LIFE_AREAS TABLE (if exists) =====
-- Note: life_areas is likely a reference table that shouldn't have user_id
-- Will handle this separately if it exists

-- =============================================================================
-- PART 3: Verify all RLS policies are correctly set
-- =============================================================================

-- Create a verification view for monitoring
CREATE OR REPLACE VIEW rls_policy_audit AS
SELECT
  t.tablename AS table_name,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count,
  CASE
    WHEN NOT t.rowsecurity THEN '❌ RLS Disabled'
    WHEN COUNT(p.policyname) = 0 THEN '❌ No Policies'
    WHEN COUNT(p.policyname) < 4 THEN '⚠️  Incomplete (' || COUNT(p.policyname)::text || '/4)'
    WHEN COUNT(p.policyname) = 4 THEN '✅ Complete'
    ELSE '⚠️  Extra policies (' || COUNT(p.policyname)::text || ')'
  END AS status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'tasks', 'projects', 'phases', 'businesses',
    'daily_pages', 'deep_work_sessions', 'health_goals',
    'content_items', 'accounts', 'balance_snapshots',
    'life_items', 'golf_scores', 'notes'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Add helpful comments
COMMENT ON VIEW rls_policy_audit IS 'Quick audit view to verify all tables have proper RLS policies configured';

-- =============================================================================
-- VERIFICATION QUERIES (for manual testing after migration)
-- =============================================================================

-- Run these queries after migration to verify:

-- 1. Check all tables have RLS enabled:
-- SELECT * FROM rls_policy_audit;

-- 2. List all policies to verify they use auth.uid():
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('tasks', 'businesses', 'projects', 'phases')
-- ORDER BY tablename, cmd;

-- 3. Verify no policies use USING (true):
-- SELECT tablename, policyname, qual
-- FROM pg_policies
-- WHERE tablename IN (
--   'tasks', 'projects', 'phases', 'businesses',
--   'daily_pages', 'deep_work_sessions', 'health_goals',
--   'content_items', 'accounts', 'balance_snapshots',
--   'life_items', 'golf_scores', 'notes'
-- )
-- AND (qual = 'true' OR with_check = 'true');
-- Expected: 0 rows (no insecure policies)
