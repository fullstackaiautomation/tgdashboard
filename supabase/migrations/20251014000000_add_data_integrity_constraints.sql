-- Data Integrity & Validation Constraints
-- Migration Date: 2025-10-14
-- Story: 3.6 - Data Integrity Validation & Backup
--
-- Adds foreign key constraints with CASCADE and CHECK constraints
-- to prevent data corruption and ensure data integrity

-- =============================================================================
-- PART 1: Add/Update Foreign Key Constraints with ON DELETE CASCADE
-- =============================================================================

-- TASKS TABLE
-- Ensure foreign keys exist with CASCADE behavior
DO $$
BEGIN
  -- Drop existing constraints if they don't have CASCADE
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_phase_id_fkey;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_business_id_fkey;
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

  -- Add constraints with CASCADE
  ALTER TABLE tasks
    ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

  ALTER TABLE tasks
    ADD CONSTRAINT tasks_phase_id_fkey
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE;

  ALTER TABLE tasks
    ADD CONSTRAINT tasks_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

  ALTER TABLE tasks
    ADD CONSTRAINT tasks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- PROJECTS TABLE
DO $$
BEGIN
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_business_id_fkey;
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

  ALTER TABLE projects
    ADD CONSTRAINT projects_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

  ALTER TABLE projects
    ADD CONSTRAINT projects_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- PHASES TABLE
DO $$
BEGIN
  ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_project_id_fkey;
  ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_user_id_fkey;

  ALTER TABLE phases
    ADD CONSTRAINT phases_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

  ALTER TABLE phases
    ADD CONSTRAINT phases_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- BUSINESSES TABLE
DO $$
BEGIN
  ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_user_id_fkey;

  ALTER TABLE businesses
    ADD CONSTRAINT businesses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- DEEP_WORK_SESSIONS TABLE
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'deep_work_sessions') THEN
    ALTER TABLE deep_work_sessions DROP CONSTRAINT IF EXISTS deep_work_sessions_task_id_fkey;
    ALTER TABLE deep_work_sessions DROP CONSTRAINT IF EXISTS deep_work_sessions_user_id_fkey;

    ALTER TABLE deep_work_sessions
      ADD CONSTRAINT deep_work_sessions_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

    ALTER TABLE deep_work_sessions
      ADD CONSTRAINT deep_work_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================================================
-- PART 2: Add CHECK Constraints for Data Validation
-- =============================================================================

-- TASKS TABLE - Validate progress percentage
DO $$
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_progress_percentage_check;

  ALTER TABLE tasks
    ADD CONSTRAINT tasks_progress_percentage_check
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100);
END $$;

-- TASKS TABLE - Validate hours
DO $$
BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_hours_check;

  ALTER TABLE tasks
    ADD CONSTRAINT tasks_hours_check
    CHECK (
      (hours_projected IS NULL OR hours_projected >= 0) AND
      (hours_worked IS NULL OR hours_worked >= 0)
    );
END $$;

-- PROJECTS TABLE - Validate progress (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'progress'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_progress_check;
    ALTER TABLE projects
      ADD CONSTRAINT projects_progress_check
      CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- PHASES TABLE - Validate progress (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phases' AND column_name = 'progress'
  ) THEN
    ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_progress_check;
    ALTER TABLE phases
      ADD CONSTRAINT phases_progress_check
      CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- PHASES TABLE - Validate sequence number (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'phases' AND column_name = 'sequence_number'
  ) THEN
    ALTER TABLE phases DROP CONSTRAINT IF EXISTS phases_sequence_check;
    ALTER TABLE phases
      ADD CONSTRAINT phases_sequence_check
      CHECK (sequence_number >= 1);
  END IF;
END $$;

-- BUSINESSES TABLE - Validate progress (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'progress'
  ) THEN
    ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_progress_check;
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_progress_check
      CHECK (progress >= 0 AND progress <= 100);
  END IF;
END $$;

-- ACCOUNTS TABLE - Validate display order
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'accounts') THEN
    ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_display_order_check;

    ALTER TABLE accounts
      ADD CONSTRAINT accounts_display_order_check
      CHECK (display_order >= 0);
  END IF;
END $$;

-- DEEP_WORK_SESSIONS TABLE - Validate session quality rating
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'deep_work_sessions') THEN
    ALTER TABLE deep_work_sessions DROP CONSTRAINT IF EXISTS deep_work_sessions_quality_check;

    ALTER TABLE deep_work_sessions
      ADD CONSTRAINT deep_work_sessions_quality_check
      CHECK (session_quality_rating IS NULL OR (session_quality_rating >= 1 AND session_quality_rating <= 5));
  END IF;
END $$;

-- =============================================================================
-- PART 3: Add Comments for Documentation
-- =============================================================================

COMMENT ON CONSTRAINT tasks_project_id_fkey ON tasks IS
  'Cascade delete: When project is deleted, all its tasks are automatically deleted';

COMMENT ON CONSTRAINT tasks_phase_id_fkey ON tasks IS
  'Cascade delete: When phase is deleted, all its tasks are automatically deleted';

COMMENT ON CONSTRAINT projects_business_id_fkey ON projects IS
  'Cascade delete: When business is deleted, all its projects are automatically deleted';

COMMENT ON CONSTRAINT phases_project_id_fkey ON phases IS
  'Cascade delete: When project is deleted, all its phases are automatically deleted';

-- =============================================================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================================================

-- Verify foreign keys:
-- SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, rc.delete_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
-- JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('tasks', 'projects', 'phases', 'businesses');

-- Verify CHECK constraints:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE contype = 'c' AND conrelid::regclass::text IN ('tasks', 'projects', 'phases', 'businesses');
