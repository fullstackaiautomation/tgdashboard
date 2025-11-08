-- Cleanup RLS Policies Migration
-- Date: 2025-10-13
-- Story: 3.3 - Fix duplicate and incomplete RLS policies

-- =============================================================================
-- PART 1: Drop ALL existing policies to start fresh
-- =============================================================================

-- Drop all policies on tasks
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'tasks'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON tasks';
    END LOOP;
END $$;

-- Drop all policies on businesses
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'businesses'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON businesses';
    END LOOP;
END $$;

-- Drop all policies on projects
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'projects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON projects';
    END LOOP;
END $$;

-- Drop all policies on phases
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'phases'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON phases';
    END LOOP;
END $$;

-- Drop all policies on accounts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'accounts'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON accounts';
    END LOOP;
END $$;

-- Drop all policies on balance_snapshots
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'balance_snapshots'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON balance_snapshots';
    END LOOP;
END $$;

-- =============================================================================
-- PART 2: Create clean, secure policies (4 per table)
-- =============================================================================

-- ===== TASKS TABLE =====
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

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

-- ===== ACCOUNTS TABLE =====
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select_policy"
  ON accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert_policy"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update_policy"
  ON accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_delete_policy"
  ON accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===== BALANCE_SNAPSHOTS TABLE =====
ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "balance_snapshots_select_policy"
  ON balance_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "balance_snapshots_insert_policy"
  ON balance_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "balance_snapshots_update_policy"
  ON balance_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "balance_snapshots_delete_policy"
  ON balance_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running, check: SELECT * FROM rls_policy_audit;
-- Expected: All tables show ✅ Complete with policy_count = 4
