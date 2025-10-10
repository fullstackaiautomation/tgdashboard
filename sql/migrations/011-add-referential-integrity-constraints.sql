-- Add referential integrity constraints with cascade options
-- This ensures tasks cannot be orphaned when projects/phases are deleted
-- Run this in Supabase SQL Editor

-- Step 1: Check existing foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'tasks';

-- Step 2: Add foreign key constraints if they don't exist
-- These will be added with ON DELETE CASCADE or ON DELETE SET NULL

-- Business FK (CASCADE - if business deleted, delete all its tasks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_business_id_fkey' AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_business_id_fkey
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Project FK (CASCADE - if project deleted, delete all its tasks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_project_id_fkey' AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Phase FK (SET NULL - if phase deleted, keep task but remove phase assignment)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_phase_id_fkey' AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_phase_id_fkey
    FOREIGN KEY (phase_id)
    REFERENCES phases(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Life Area FK (CASCADE - if life area deleted, delete all its tasks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_life_area_id_fkey' AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_life_area_id_fkey
    FOREIGN KEY (life_area_id)
    REFERENCES life_areas(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Verify constraints were added
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'tasks'
ORDER BY tc.constraint_name;
